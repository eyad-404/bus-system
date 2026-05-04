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
import java.util.Optional;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final RouteStationRepository routeStationRepository;
    private final TripProgressRepository tripProgressRepository;
    private final NotificationService notificationService;
    private final org.smartclinic.bus_system.Repository.StudentRepository studentRepository;

    @org.springframework.beans.factory.annotation.Value("${bus.average-minutes-between-stations:5}")
    private int averageMinutes;

    public TripService(TripRepository tripRepository,
                       RouteStationRepository routeStationRepository,
                       TripProgressRepository tripProgressRepository,
                       NotificationService notificationService,
                       org.smartclinic.bus_system.Repository.StudentRepository studentRepository) {
        this.tripRepository = tripRepository;
        this.routeStationRepository = routeStationRepository;
        this.tripProgressRepository = tripProgressRepository;
        this.notificationService = notificationService;
        this.studentRepository = studentRepository;
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
        List<Station> orderedStations =
                routeStationRepository.findByRouteIdOrderByOrderIndexAsc(trip.getRoute().getId())
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

        updateTripProgress(trip, nextStation);
        notificationService.notifyStudentsForStation(nextStation, trip, false);

        Trip savedTrip = tripRepository.save(trip);

        TripResponseDTO response = TripMapper.toDTO(savedTrip);
        response.setStationProgress(buildStationProgress(savedTrip));

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
        response.setStationProgress(buildStationProgress(savedTrip));

        return response;
    }

    protected void updateTripProgress(Trip trip, Station nextStation) {

        tripProgressRepository.findOptionalByTripIdAndStatus(trip.getId(), ProgressStatus.CURRENT)
                .ifPresent(currentProgress -> {
                    currentProgress.setStatus(ProgressStatus.COMPLETED);
                    tripProgressRepository.save(currentProgress);
                });

        TripProgress nextProgress;

        Optional<TripProgress> result =
                tripProgressRepository.findByTripIdAndStationId(trip.getId(), nextStation.getId());

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

        List<Station> orderedStations =
                routeStationRepository.findByRouteIdOrderByOrderIndexAsc(trip.getRoute().getId())
                        .stream()
                        .map(RouteStation::getStation)
                        .toList();

        int currentIndex = trip.getCurrentStationIndex();

        List<StationProgressDTO> stationProgress = new ArrayList<>(orderedStations.size());

        for (int i = 0; i < orderedStations.size(); i++) {

            Station station = orderedStations.get(i);

            StationProgressDTO dto = new StationProgressDTO();
            dto.setStationId(station.getId());
            dto.setStationName(station.getName());

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
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Trip not found"));

        org.smartclinic.bus_system.DTOs.TripStatusResponseDTO statusDTO = new org.smartclinic.bus_system.DTOs.TripStatusResponseDTO();
        statusDTO.setTripId(trip.getId());
        statusDTO.setStatus(trip.getStatus().name());

        if (trip.getRoute() != null) {
            statusDTO.setRouteId(trip.getRoute().getId());

            routeStationRepository.findByRouteIdAndOrderIndex(trip.getRoute().getId(), trip.getCurrentStationIndex())
                    .ifPresent(rs -> {
                        statusDTO.setCurrentStationId(rs.getStation().getId());
                        statusDTO.setCurrentStationName(rs.getStation().getName());
                    });
        }
        return statusDTO;
    }

    @Transactional
    public TripResponseDTO updateCurrentStation(Long tripId, Long stationId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Trip not found"));

        if (trip.getRoute() == null) {
            throw new org.smartclinic.bus_system.Exception.BadRequestException("Trip has no route assigned");
        }

        RouteStation rs = routeStationRepository.findByRouteIdAndStationId(trip.getRoute().getId(), stationId)
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.BadRequestException("Station does not belong to trip route"));

        if (trip.getStatus() == TripStatus.NOT_STARTED) {
            trip.setStatus(TripStatus.IN_PROGRESS);
        }

        trip.setCurrentStationIndex(rs.getOrderIndex());
        updateTripProgress(trip, rs.getStation());

        long totalStations = routeStationRepository.countByRouteId(trip.getRoute().getId());
        if (rs.getOrderIndex() >= totalStations) {
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
        response.setStationProgress(buildStationProgress(savedTrip));

        return response;
    }

    @Transactional(readOnly = true)
    public Station getNextStation(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Trip not found"));

        if (trip.getRoute() == null) {
            return null;
        }

        int nextIndex = trip.getCurrentStationIndex() + 1;

        return routeStationRepository.findByRouteIdAndOrderIndex(trip.getRoute().getId(), nextIndex)
                .map(RouteStation::getStation)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public org.smartclinic.bus_system.DTOs.EtaResponseDTO getEtaForStudent(Long tripId, Long studentId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Trip not found"));

        org.smartclinic.bus_system.Entity.Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Student not found"));

        if (student.getBoardingStation() == null) {
            throw new org.smartclinic.bus_system.Exception.BadRequestException("Student has no boarding station assigned");
        }

        if (trip.getRoute() == null) {
            throw new org.smartclinic.bus_system.Exception.BadRequestException("Trip has no route assigned");
        }

        RouteStation studentRouteStation = routeStationRepository.findByRouteIdAndStationId(trip.getRoute().getId(), student.getBoardingStation().getId())
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.BadRequestException("Student boarding station is not on the trip's route"));

        int currentStationIndex = trip.getCurrentStationIndex();
        int studentOrder = studentRouteStation.getOrderIndex();

        int remainingStations = studentOrder - currentStationIndex;

        if (remainingStations <= 0) {
             org.smartclinic.bus_system.DTOs.EtaResponseDTO eta = new org.smartclinic.bus_system.DTOs.EtaResponseDTO();
             eta.setStudentId(studentId);
             eta.setTripId(tripId);
             eta.setEtaMinutes(0); // Bus passed or is at station
             return eta;
        }

        int etaMinutes = remainingStations * averageMinutes;

        org.smartclinic.bus_system.DTOs.EtaResponseDTO eta = new org.smartclinic.bus_system.DTOs.EtaResponseDTO();
        eta.setStudentId(studentId);
        eta.setTripId(tripId);
        eta.setEtaMinutes(etaMinutes);

        return eta;
    }
}