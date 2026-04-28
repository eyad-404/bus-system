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
}
