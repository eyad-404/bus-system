package org.smartclinic.bus_system.Controller;

import org.smartclinic.bus_system.DTOs.EtaResponseDTO;
import org.smartclinic.bus_system.DTOs.StationResponseDTO;
import org.smartclinic.bus_system.DTOs.TripResponseDTO;
import org.smartclinic.bus_system.DTOs.TripStatusResponseDTO;
import org.smartclinic.bus_system.Entity.Driver;
import org.smartclinic.bus_system.Entity.Route;
import org.smartclinic.bus_system.Entity.Station;
import org.smartclinic.bus_system.Entity.Trip;
import org.smartclinic.bus_system.MAPPER.StationMapper;
import org.smartclinic.bus_system.MAPPER.TripMapper;
import org.smartclinic.bus_system.Repository.DriverRepository;
import org.smartclinic.bus_system.Repository.RouteRepository;
import org.smartclinic.bus_system.Repository.RouteStationRepository;
import org.smartclinic.bus_system.Repository.TripRepository;
import org.smartclinic.bus_system.Service.TripService;
import org.smartclinic.bus_system.enums.TripStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;
    private final DriverRepository driverRepository;
    private final RouteRepository routeRepository;
    private final TripRepository tripRepository;
    private final RouteStationRepository routeStationRepository;

    public TripController(TripService tripService,
            DriverRepository driverRepository,
            RouteRepository routeRepository,
            TripRepository tripRepository,
            RouteStationRepository routeStationRepository) {
        this.tripService = tripService;
        this.driverRepository = driverRepository;
        this.routeRepository = routeRepository;
        this.tripRepository = tripRepository;
        this.routeStationRepository = routeStationRepository;
    }

    @GetMapping("/my-trip")
    public ResponseEntity<TripResponseDTO> getMyTrip(@RequestParam Long userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        Optional<Trip> inProgress = tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.IN_PROGRESS);
        if (inProgress.isPresent()) {
            TripResponseDTO dto = TripMapper.toDTO(inProgress.get());
            dto.setStationProgress(tripService.buildStationProgress(inProgress.get()));
            if (inProgress.get().getRoute() != null) {
                routeStationRepository
                        .findByRouteIdAndOrderIndex(inProgress.get().getRoute().getId(),
                                inProgress.get().getCurrentStationIndex())
                        .ifPresent(rs -> dto.setCurrentStationName(rs.getStation().getName()));
            }
            return ResponseEntity.ok(dto);
        }

        Optional<Trip> notStarted = tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.NOT_STARTED);
        if (notStarted.isPresent()) {
            TripResponseDTO dto = TripMapper.toDTO(notStarted.get());
            dto.setStationProgress(tripService.buildStationProgress(notStarted.get()));
            return ResponseEntity.ok(dto);
        }

        Route route = routeRepository.findByDriverId(driver.getId()).orElse(null);
        if (route != null) {
            TripResponseDTO dto = new TripResponseDTO();
            dto.setRouteId(route.getId());
            dto.setRouteName(route.getName());
            dto.setRouteCode(route.getCode());
            dto.setDriverId(driver.getId());
            dto.setStatus("NOT_STARTED");
            return ResponseEntity.ok(dto);
        }

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/start")
    public ResponseEntity<TripResponseDTO> startTrip(@RequestParam Long userId) {
        return ResponseEntity.ok(tripService.startTrip(userId));
    }

    @GetMapping("/active")
    public ResponseEntity<List<TripResponseDTO>> getActiveTrips() {
        return ResponseEntity.ok(tripService.getActiveTrips());
    }

    @GetMapping
    public ResponseEntity<List<TripResponseDTO>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips());
    }

    @PutMapping("/{tripId}/next")
    public ResponseEntity<TripResponseDTO> moveToNextStation(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripService.moveToNextStation(tripId));
    }

    @PutMapping("/{tripId}/end")
    public ResponseEntity<TripResponseDTO> endTrip(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripService.endTrip(tripId));
    }

    @GetMapping("/{tripId}/status")
    public ResponseEntity<TripStatusResponseDTO> getTripStatus(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripService.getTripStatus(tripId));
    }

    @PutMapping("/{tripId}/current-station/{stationId}")
    public ResponseEntity<TripResponseDTO> updateCurrentStation(@PathVariable Long tripId,
            @PathVariable Long stationId) {
        return ResponseEntity.ok(tripService.updateCurrentStation(tripId, stationId));
    }

    @GetMapping("/{tripId}/next-station")
    public ResponseEntity<StationResponseDTO> getNextStation(@PathVariable Long tripId) {
        Station station = tripService.getNextStation(tripId);
        if (station == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(StationMapper.toDTO(station));
    }

    @GetMapping("/{tripId}/eta/{studentId}")
    public ResponseEntity<EtaResponseDTO> getEta(@PathVariable Long tripId, @PathVariable Long studentId) {
        return ResponseEntity.ok(tripService.getEtaForStudent(tripId, studentId));
    }
}
