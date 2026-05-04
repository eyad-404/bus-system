package org.smartclinic.bus_system.Controller;

import org.smartclinic.bus_system.DTOs.RouteRequestDTO;
import org.smartclinic.bus_system.DTOs.RouteResponseDTO;
import org.smartclinic.bus_system.Entity.Driver;
import org.smartclinic.bus_system.Entity.Route;
import org.smartclinic.bus_system.Repository.DriverRepository;
import org.smartclinic.bus_system.Repository.RouteRepository;
import org.smartclinic.bus_system.Service.RouteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;
    private final RouteRepository routeRepository;
    private final DriverRepository driverRepository;

    public RouteController(RouteService routeService,
                           RouteRepository routeRepository,
                           DriverRepository driverRepository) {
        this.routeService = routeService;
        this.routeRepository = routeRepository;
        this.driverRepository = driverRepository;
    }

    @GetMapping
    public ResponseEntity<List<RouteResponseDTO>> getAllRoutes(
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(routeService.getAllRoutes(name));
    }

    @GetMapping("/{routeId}")
    public ResponseEntity<RouteResponseDTO> getRouteById(@PathVariable Long routeId) {
        return ResponseEntity.ok(routeService.getRouteById(routeId));
    }

    @PostMapping
    public ResponseEntity<RouteResponseDTO> createRoute(@RequestBody RouteRequestDTO requestDTO) {
        return ResponseEntity.ok(routeService.createRoute(requestDTO));
    }

    @PutMapping("/{routeId}")
    public ResponseEntity<RouteResponseDTO> updateRoute(@PathVariable Long routeId,
                                                        @RequestBody RouteRequestDTO requestDTO) {
        return ResponseEntity.ok(routeService.updateRoute(routeId, requestDTO));
    }

    @DeleteMapping("/{routeId}")
    public ResponseEntity<Void> deleteRoute(@PathVariable Long routeId) {
        routeService.deleteRoute(routeId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{routeId}/assign-driver")
    public ResponseEntity<RouteResponseDTO> assignDriver(
            @PathVariable Long routeId,
            @RequestParam Long driverId) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));
        Driver driver = driverRepository.findByUserId(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        route.setDriver(driver);
        return ResponseEntity.ok(org.smartclinic.bus_system.MAPPER.RouteMapper.toDTO(routeRepository.save(route)));
    }

    @DeleteMapping("/{routeId}/driver")
    public ResponseEntity<RouteResponseDTO> removeDriver(@PathVariable Long routeId) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));
        route.setDriver(null);
        return ResponseEntity.ok(org.smartclinic.bus_system.MAPPER.RouteMapper.toDTO(routeRepository.save(route)));
    }
}
