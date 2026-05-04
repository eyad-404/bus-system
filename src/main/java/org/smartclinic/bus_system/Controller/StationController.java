package org.smartclinic.bus_system.Controller;

import org.smartclinic.bus_system.DTOs.ReorderRequestDTO;
import org.smartclinic.bus_system.DTOs.RouteStationResponseDTO;
import org.smartclinic.bus_system.DTOs.StationRequestDTO;
import org.smartclinic.bus_system.Service.StationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes/{routeId}/stations")
public class StationController {

    private final StationService stationService;

    public StationController(StationService stationService) {
        this.stationService = stationService;
    }

    @GetMapping
    public ResponseEntity<List<RouteStationResponseDTO>> getStations(@PathVariable Long routeId) {
        return ResponseEntity.ok(stationService.getStationsForRoute(routeId));
    }

    @PostMapping
    public ResponseEntity<RouteStationResponseDTO> addStation(
            @PathVariable Long routeId,
            @RequestBody StationRequestDTO dto) {
        return ResponseEntity.ok(stationService.addStation(routeId, dto));
    }

    @PutMapping("/{routeStationId}")
    public ResponseEntity<RouteStationResponseDTO> updateStation(
            @PathVariable Long routeId,
            @PathVariable Long routeStationId,
            @RequestBody StationRequestDTO dto) {
        return ResponseEntity.ok(stationService.updateStation(routeId, routeStationId, dto));
    }

    @DeleteMapping("/{routeStationId}")
    public ResponseEntity<Void> deleteStation(
            @PathVariable Long routeId,
            @PathVariable Long routeStationId) {
        stationService.deleteStation(routeId, routeStationId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<List<RouteStationResponseDTO>> reorder(
            @PathVariable Long routeId,
            @RequestBody ReorderRequestDTO dto) {
        return ResponseEntity.ok(stationService.reorder(routeId, dto));
    }
}
