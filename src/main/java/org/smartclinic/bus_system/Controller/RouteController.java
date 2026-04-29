package org.smartclinic.bus_system.Controller;

import org.smartclinic.bus_system.DTOs.RouteRequestDTO;
import org.smartclinic.bus_system.DTOs.RouteResponseDTO;
import org.smartclinic.bus_system.Service.RouteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
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
}
