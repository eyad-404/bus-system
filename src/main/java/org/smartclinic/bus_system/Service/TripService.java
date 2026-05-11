package org.smartclinic.bus_system.Service;

import org.smartclinic.bus_system.DTOs.StationProgressDTO;
import org.smartclinic.bus_system.DTOs.TripResponseDTO;
import org.smartclinic.bus_system.Entity.RouteStation;
import org.smartclinic.bus_system.Entity.Station;
import org.smartclinic.bus_system.Entity.Trip;
import org.smartclinic.bus_system.Entity.TripProgress;
import org.smartclinic.bus_system.MAPPER.TripMapper;
import org.smartclinic.bus_system.Repository.RouteStationRepository;
import org.smartclinic.bus_system.Repository.TripProgressRepository;
import org.smartclinic.bus_system.Repository.TripRepository;
import org.smartclinic.bus_system.enums.ProgressStatus;
import org.smartclinic.bus_system.enums.TripStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final RouteStationRepository routeStationRepository;
    private final TripProgressRepository tripProgressRepository;
    private final NotificationService notificationService;
    private final org.smartclinic.bus_system.Repository.StudentRepository studentRepository;
    private final org.smartclinic.bus_system.Repository.DriverRepository driverRepository;
    private final org.smartclinic.bus_system.Repository.RouteRepository routeRepository;

    @org.springframework.beans.factory.annotation.Value("${bus.average-minutes-between-stations:5}")
    private int averageMinutes;

    public TripService(TripRepository tripRepository,
            RouteStationRepository routeStationRepository,
            TripProgressRepository tripProgressRepository,
            NotificationService notificationService,
            org.smartclinic.bus_system.Repository.StudentRepository studentRepository,
            org.smartclinic.bus_system.Repository.DriverRepository driverRepository,
            org.smartclinic.bus_system.Repository.RouteRepository routeRepository) {
        this.tripRepository = tripRepository;
        this.routeStationRepository = routeStationRepository;
        this.tripProgressRepository = tripProgressRepository;
        this.notificationService = notificationService;
        this.studentRepository = studentRepository;
        this.driverRepository = driverRepository;
        this.routeRepository = routeRepository;
    }

    /**
     * Route stations sorted by {@link RouteStation#getOrderIndex()} (typically 1..n).
     * {@link Trip#getCurrentStationIndex()} is always a 0-based index into this list — not the same as orderIndex.
     */
    private List<RouteStation> orderedRouteStations(Long routeId) {
        return routeStationRepository.findByRouteIdOrderByOrderIndexAsc(routeId);
    }

    private Optional<RouteStation> routeStationAtTripListIndex(Trip trip) {
        if (trip.getRoute() == null || trip.getRoute().getId() == null) {
            return Optional.empty();
        }
        List<RouteStation> ordered = orderedRouteStations(trip.getRoute().getId());
        int i = trip.getCurrentStationIndex();
        if (ordered.isEmpty() || i < 0 || i >= ordered.size()) {
            return Optional.empty();
        }
        return Optional.of(ordered.get(i));
    }

    private int listIndexOfStationOnRoute(Long routeId, Long stationId) {
        List<RouteStation> ordered = orderedRouteStations(routeId);
        for (int i = 0; i < ordered.size(); i++) {
            Station s = ordered.get(i).getStation();
            if (s != null && stationId != null && stationId.equals(s.getId())) {
                return i;
            }
        }
        return -1;
    }

    @Transactional
    public TripResponseDTO startTrip(Long userId) {
        org.smartclinic.bus_system.Entity.Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        Optional<Trip> existing = tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.IN_PROGRESS);
        if (existing.isPresent()) {
            TripResponseDTO dto = TripMapper.toDTO(existing.get());
            dto.setStationProgress(buildStationProgress(existing.get()));
            return dto;
        }

        org.smartclinic.bus_system.Entity.Route route = routeRepository.findByDriverId(driver.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No route assigned to driver"));

        Optional<Trip> notStarted = tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.NOT_STARTED);
        Trip trip = notStarted.orElseGet(() -> {
            Trip t = new Trip();
            t.setRoute(route);
            t.setDriver(driver);
            return t;
        });

        trip.setStatus(TripStatus.IN_PROGRESS);
        trip.setStartTime(LocalDateTime.now());
        trip.setCurrentStationIndex(0);

        Trip saved = tripRepository.save(trip);

        // Create the first progress marker for the 1-minute wait rule (index 0 = first stop in route order)
        List<RouteStation> ordered = orderedRouteStations(route.getId());
        if (!ordered.isEmpty()) {
            updateTripProgress(saved, ordered.get(0).getStation());
        }

        // Notify all students on the route that the trip started
        notificationService.notifyAllStudentsOnRoute(route, saved, "Trip Started", "Your bus has started its trip and is on the way!");

        TripResponseDTO dto = TripMapper.toDTO(saved);
        enrichTripResponse(saved, dto);
        return dto;
    }

    @Transactional
    public TripResponseDTO moveToNextStation(Long tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));

        if (trip.getStatus() != TripStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip is not in progress");
        }

        if (trip.getRoute() == null || trip.getRoute().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip has no route assigned");
        }

        // ✅ FIX: RouteStation instead of StationRepository
        List<Station> orderedStations = routeStationRepository
                .findByRouteIdOrderByOrderIndexAsc(trip.getRoute().getId())
                .stream()
                .map(RouteStation::getStation)
                .toList();

        if (orderedStations.isEmpty()) {
            return endTrip(tripId);
        }

        int currentIndex = trip.getCurrentStationIndex();
        int nextIndex = currentIndex + 1;

        if (nextIndex >= orderedStations.size()) {
            return endTrip(tripId);
        }

        Station nextStation = orderedStations.get(nextIndex);

        trip.setCurrentStationIndex(nextIndex);
        Trip savedTrip = tripRepository.save(trip);

        updateTripProgress(savedTrip, nextStation);

        // Notify students at next station that the bus is approaching
        notificationService.notifyStudentsForStation(nextStation, savedTrip, true);

        TripResponseDTO response = TripMapper.toDTO(savedTrip);
        enrichTripResponse(savedTrip, response);

        return response;
    }

    @Transactional
    public TripResponseDTO endTrip(Long tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));

        trip.setStatus(TripStatus.COMPLETED);
        trip.setEndTime(LocalDateTime.now());

        Trip savedTrip = tripRepository.save(trip);

        TripResponseDTO response = TripMapper.toDTO(savedTrip);
        enrichTripResponse(savedTrip, response);

        return response;
    }

    @Transactional
    public void notifyArrivedAtStation(Trip trip, Station station) {
        // Send an ARRIVAL notification to all students at this station
        notificationService.notifyStudentsForStation(station, trip, false);
    }

    @Transactional
    public void notifyArrivedAtCurrentStation(Long tripId) {
        Trip trip = tripRepository.findByIdWithRoute(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));

        if (trip.getStatus() != TripStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip is not in progress");
        }

        if (trip.getRoute() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip has no route assigned");
        }

        RouteStation rs = routeStationAtTripListIndex(trip)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Trip has no valid current stop for this route."));
        Station station = rs.getStation();

        tripProgressRepository.findByTripIdAndStationId(trip.getId(), station.getId())
                .ifPresent(currentProgress -> {
                    // Only enforce the 1-minute wait for stations after the first one
                    if (trip.getCurrentStationIndex() > 0 && currentProgress.getArrivalTime() != null) {
                        long secondsElapsed = java.time.Duration
                                .between(currentProgress.getArrivalTime(), LocalDateTime.now())
                                .getSeconds();
                        if (secondsElapsed < 60) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Please wait at least 1 minute before sending an arrival notification.");
                        }
                    }
                    currentProgress.setHasArrived(true);
                    tripProgressRepository.save(currentProgress);
                });

        notifyArrivedAtStation(trip, station);
    }

    protected void updateTripProgress(Trip trip, Station nextStation) {

        for (TripProgress currentProgress : tripProgressRepository.findAllByTripIdAndStatus(trip.getId(),
                ProgressStatus.CURRENT)) {
            currentProgress.setStatus(ProgressStatus.COMPLETED);
            tripProgressRepository.save(currentProgress);
        }

        TripProgress nextProgress;

        Optional<TripProgress> result = tripProgressRepository.findByTripIdAndStationId(trip.getId(),
                nextStation.getId());

        if (result.isPresent()) {
            nextProgress = result.get();
        } else {
            TripProgress tp = new TripProgress();
            tp.setTrip(trip);
            tp.setStation(nextStation);
            nextProgress = tp;
        }

        nextProgress.setStatus(ProgressStatus.CURRENT);
        nextProgress.setArrivalTime(LocalDateTime.now());

        tripProgressRepository.save(nextProgress);
    }

    @Transactional(readOnly = true)
    public List<StationProgressDTO> buildStationProgress(Trip trip) {

        if (trip.getRoute() == null || trip.getRoute().getId() == null) {
            return List.of();
        }

        List<Station> orderedStations = routeStationRepository
                .findByRouteIdOrderByOrderIndexAsc(trip.getRoute().getId())
                .stream()
                .map(RouteStation::getStation)
                .toList();

        int currentIndex = trip.getCurrentStationIndex();

        Map<Long, TripProgress> progressByStationId = tripProgressRepository
                .findByTripId(trip.getId())
                .stream()
                .filter(tp -> tp.getStation() != null && tp.getStation().getId() != null)
                .collect(Collectors.toMap(tp -> tp.getStation().getId(), Function.identity(), (a, b) -> b));

        List<StationProgressDTO> stationProgress = new ArrayList<>(orderedStations.size());

        for (int i = 0; i < orderedStations.size(); i++) {

            Station station = orderedStations.get(i);

            StationProgressDTO dto = new StationProgressDTO();
            dto.setStationId(station.getId());
            dto.setStationName(station.getName());

            TripProgress tp = progressByStationId.get(station.getId());
            if (tp != null) {
                if (tp.getArrivalTime() != null) {
                    dto.setArrivalTime(tp.getArrivalTime());
                }
                dto.setHasArrived(tp.getHasArrived());
            } else {
                dto.setHasArrived(false);
            }

            if (i < currentIndex) {
                dto.setStatus(ProgressStatus.COMPLETED.name());
            } else if (i == currentIndex && trip.getStatus() == TripStatus.IN_PROGRESS) {
                dto.setStatus(ProgressStatus.CURRENT.name());
            } else {
                dto.setStatus(ProgressStatus.PENDING.name());
            }

            stationProgress.add(dto);
        }

        return stationProgress;
    }

    @Transactional(readOnly = true)
    public org.smartclinic.bus_system.DTOs.TripStatusResponseDTO getTripStatus(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(
                        () -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Trip not found"));

        org.smartclinic.bus_system.DTOs.TripStatusResponseDTO statusDTO = new org.smartclinic.bus_system.DTOs.TripStatusResponseDTO();
        statusDTO.setTripId(trip.getId());
        statusDTO.setStatus(trip.getStatus().name());

        if (trip.getRoute() != null) {
            statusDTO.setRouteId(trip.getRoute().getId());

            routeStationAtTripListIndex(trip).ifPresent(rs -> {
                statusDTO.setCurrentStationId(rs.getStation().getId());
                statusDTO.setCurrentStationName(rs.getStation().getName());
            });
        }
        return statusDTO;
    }

    @Transactional(readOnly = true)
    public List<TripResponseDTO> getActiveTrips() {
        return tripRepository.findAllByStatus(TripStatus.IN_PROGRESS)
                .stream()
                .map(trip -> {
                    TripResponseDTO dto = TripMapper.toDTO(trip);
                    enrichTripResponse(trip, dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TripResponseDTO> getAllTrips() {
        return tripRepository.findAll()
                .stream()
                .map(trip -> {
                    TripResponseDTO dto = TripMapper.toDTO(trip);
                    dto.setStationProgress(buildStationProgress(trip));
                    if (trip.getRoute() != null) {
                        routeStationAtTripListIndex(trip).ifPresent(rs -> dto.setCurrentStationName(rs.getStation().getName()));
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public TripResponseDTO updateCurrentStation(Long tripId, Long stationId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(
                        () -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Trip not found"));

        if (trip.getRoute() == null) {
            throw new org.smartclinic.bus_system.Exception.BadRequestException("Trip has no route assigned");
        }

        RouteStation rs = routeStationRepository.findByRouteIdAndStationId(trip.getRoute().getId(), stationId)
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.BadRequestException(
                        "Station does not belong to trip route"));

        if (trip.getStatus() == TripStatus.NOT_STARTED) {
            trip.setStatus(TripStatus.IN_PROGRESS);
        }

        int listIndex = listIndexOfStationOnRoute(trip.getRoute().getId(), stationId);
        if (listIndex < 0) {
            throw new org.smartclinic.bus_system.Exception.BadRequestException("Station not found on route");
        }
        trip.setCurrentStationIndex(listIndex);
        updateTripProgress(trip, rs.getStation());

        List<RouteStation> ordered = orderedRouteStations(trip.getRoute().getId());
        if (!ordered.isEmpty() && listIndex >= ordered.size() - 1) {
            trip.setStatus(TripStatus.COMPLETED);
            trip.setEndTime(LocalDateTime.now());
        }

        Trip savedTrip = tripRepository.save(trip);

        // Notifications
        notificationService.notifyStudentsForStation(rs.getStation(), savedTrip, false); // arrival

        // Approaching alert for next station
        Station nextStation = getNextStation(tripId);
        if (nextStation != null) {
            notificationService.notifyStudentsForStation(nextStation, savedTrip, true); // approaching
        }

        TripResponseDTO response = TripMapper.toDTO(savedTrip);
        enrichTripResponse(savedTrip, response);

        return response;
    }

    @Transactional(readOnly = true)
    public Station getNextStation(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(
                        () -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Trip not found"));

        if (trip.getRoute() == null) {
            return null;
        }

        List<RouteStation> ordered = orderedRouteStations(trip.getRoute().getId());
        int nextIndex = trip.getCurrentStationIndex() + 1;
        if (nextIndex < 0 || nextIndex >= ordered.size()) {
            return null;
        }
        return ordered.get(nextIndex).getStation();
    }

    @Transactional(readOnly = true)
    public org.smartclinic.bus_system.DTOs.EtaResponseDTO getEtaForStudent(Long tripId, Long studentId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(
                        () -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Trip not found"));

        org.smartclinic.bus_system.Entity.Student student = studentRepository.findById(studentId)
                .orElseThrow(
                        () -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Student not found"));

        if (student.getBoardingStation() == null) {
            throw new org.smartclinic.bus_system.Exception.BadRequestException(
                    "Student has no boarding station assigned");
        }

        if (trip.getRoute() == null) {
            throw new org.smartclinic.bus_system.Exception.BadRequestException("Trip has no route assigned");
        }

        routeStationRepository
                .findByRouteIdAndStationId(trip.getRoute().getId(), student.getBoardingStation().getId())
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.BadRequestException(
                        "Student boarding station is not on the trip's route"));

        int busListIndex = trip.getCurrentStationIndex();
        int studentListIndex = listIndexOfStationOnRoute(trip.getRoute().getId(), student.getBoardingStation().getId());

        int remainingStations = studentListIndex - busListIndex;

        if (remainingStations <= 0) {
            org.smartclinic.bus_system.DTOs.EtaResponseDTO eta = new org.smartclinic.bus_system.DTOs.EtaResponseDTO();
            eta.setStudentId(studentId);
            eta.setTripId(tripId);
            eta.setEtaMinutes(0); // Bus passed or is at station
            return eta;
        }

        RouteStation currentRouteStation = routeStationAtTripListIndex(trip).orElse(null);
        TripProgress currentProgress = null;
        if (currentRouteStation != null && currentRouteStation.getStation() != null) {
            currentProgress = tripProgressRepository
                    .findByTripIdAndStationId(trip.getId(), currentRouteStation.getStation().getId())
                    .orElse(null);
        }
        int elapsedMinutes = 0;
        if (currentProgress != null && currentProgress.getArrivalTime() != null) {
            elapsedMinutes = (int) java.time.Duration.between(currentProgress.getArrivalTime(), LocalDateTime.now()).toMinutes();
        }

        int etaMinutes = (remainingStations * averageMinutes) - elapsedMinutes;
        if (etaMinutes < 0) {
            etaMinutes = 0;
        }

        org.smartclinic.bus_system.DTOs.EtaResponseDTO eta = new org.smartclinic.bus_system.DTOs.EtaResponseDTO();
        eta.setStudentId(studentId);
        eta.setTripId(tripId);
        eta.setEtaMinutes(etaMinutes);

        return eta;
    }

    public void enrichTripResponse(Trip trip, TripResponseDTO dto) {
        dto.setStationProgress(buildStationProgress(trip));
        if (trip.getRoute() != null) {
            routeStationAtTripListIndex(trip).ifPresent(rs -> dto.setCurrentStationName(rs.getStation().getName()));
            dto.setPassengerCount(studentRepository.countByRouteId(trip.getRoute().getId()));
        } else {
            dto.setPassengerCount(0);
        }
    }
}