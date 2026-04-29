package org.smartclinic.bus_system.Controller;

import org.smartclinic.bus_system.DTOs.TripResponseDTO;
import org.smartclinic.bus_system.Service.TripService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PutMapping("/{tripId}/next")
    public ResponseEntity<TripResponseDTO> moveToNextStation(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripService.moveToNextStation(tripId));
    }

    @PutMapping("/{tripId}/end")
    public ResponseEntity<TripResponseDTO> endTrip(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripService.endTrip(tripId));
    }

    @org.springframework.web.bind.annotation.GetMapping("/{tripId}/status")
    public ResponseEntity<org.smartclinic.bus_system.DTOs.TripStatusResponseDTO> getTripStatus(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripService.getTripStatus(tripId));
    }

    @PutMapping("/{tripId}/current-station/{stationId}")
    public ResponseEntity<TripResponseDTO> updateCurrentStation(@PathVariable Long tripId, @PathVariable Long stationId) {
        return ResponseEntity.ok(tripService.updateCurrentStation(tripId, stationId));
    }

    @org.springframework.web.bind.annotation.GetMapping("/{tripId}/next-station")
    public ResponseEntity<org.smartclinic.bus_system.DTOs.StationResponseDTO> getNextStation(@PathVariable Long tripId) {
        org.smartclinic.bus_system.Entity.Station station = tripService.getNextStation(tripId);
        if (station == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(org.smartclinic.bus_system.MAPPER.StationMapper.toDTO(station));
    }

    @org.springframework.web.bind.annotation.GetMapping("/{tripId}/eta/{studentId}")
    public ResponseEntity<org.smartclinic.bus_system.DTOs.EtaResponseDTO> getEta(@PathVariable Long tripId, @PathVariable Long studentId) {
        return ResponseEntity.ok(tripService.getEtaForStudent(tripId, studentId));
    }
}
