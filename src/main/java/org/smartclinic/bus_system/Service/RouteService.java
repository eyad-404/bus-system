package org.smartclinic.bus_system.Service;

import org.smartclinic.bus_system.DTOs.RouteRequestDTO;
import org.smartclinic.bus_system.DTOs.RouteResponseDTO;
import org.smartclinic.bus_system.Entity.Route;
import org.smartclinic.bus_system.MAPPER.RouteMapper;
import org.smartclinic.bus_system.Repository.RouteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RouteService {

    private final RouteRepository routeRepository;

    public RouteService(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    @Transactional(readOnly = true)
    public List<RouteResponseDTO> getAllRoutes(String name) {

        List<Route> routes = (name == null || name.isBlank())
                ? routeRepository.findAll()
                : routeRepository.findByNameContainingIgnoreCase(name);

        return routes.stream()
                .map(RouteMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public RouteResponseDTO getRouteById(Long id) {

        Route route = routeRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));

        return RouteMapper.toDTO(route);
    }

    @Transactional
    public RouteResponseDTO createRoute(RouteRequestDTO requestDTO) {

        if (requestDTO == null ||
                requestDTO.getName() == null || requestDTO.getName().isBlank() ||
                requestDTO.getCode() == null || requestDTO.getCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        validateUniqueCode(requestDTO.getCode(), null);

        Route route = new Route();
        route.setName(requestDTO.getName());
        route.setCode(requestDTO.getCode());

        return RouteMapper.toDTO(routeRepository.save(route));
    }

    @Transactional
    public RouteResponseDTO updateRoute(Long id, RouteRequestDTO requestDTO) {

        Route route = routeRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));

        if (requestDTO == null ||
                requestDTO.getName() == null || requestDTO.getName().isBlank() ||
                requestDTO.getCode() == null || requestDTO.getCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        validateUniqueCode(requestDTO.getCode(), id);

        route.setName(requestDTO.getName());
        route.setCode(requestDTO.getCode());

        return RouteMapper.toDTO(routeRepository.save(route));
    }

    @Transactional
    public void deleteRoute(Long id) {

        Route route = routeRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));

        routeRepository.delete(route);
    }

    private void validateUniqueCode(String code, Long currentId) {

        routeRepository.findByCode(code).ifPresent(existing -> {

            if (currentId == null || !existing.getId().equals(currentId)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Route code already exists"
                );
            }
        });
    }
}