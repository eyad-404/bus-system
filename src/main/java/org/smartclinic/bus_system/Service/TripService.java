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

    public TripService(TripRepository tripRepository,
                       RouteStationRepository routeStationRepository,
                       TripProgressRepository tripProgressRepository,
                       NotificationService notificationService) {
        this.tripRepository = tripRepository;
        this.routeStationRepository = routeStationRepository;
        this.tripProgressRepository = tripProgressRepository;
        this.notificationService = notificationService;
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
        notificationService.notifyStudentsForStation(nextStation);

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
}