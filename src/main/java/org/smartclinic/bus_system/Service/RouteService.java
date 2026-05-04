package org.smartclinic.bus_system.Service;

import org.smartclinic.bus_system.DTOs.RouteRequestDTO;
import org.smartclinic.bus_system.DTOs.RouteResponseDTO;
import org.smartclinic.bus_system.Entity.Route;
import org.smartclinic.bus_system.MAPPER.RouteMapper;
import org.smartclinic.bus_system.Repository.RouteRepository;
import org.smartclinic.bus_system.Repository.RouteStationRepository;
import org.smartclinic.bus_system.Repository.StationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RouteService {

    private final RouteRepository routeRepository;
    private final RouteStationRepository routeStationRepository;
    private final StationRepository stationRepository;

    public RouteService(RouteRepository routeRepository,
                        RouteStationRepository routeStationRepository,
                        StationRepository stationRepository) {
        this.routeRepository = routeRepository;
        this.routeStationRepository = routeStationRepository;
        this.stationRepository = stationRepository;
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

        List<Long> stationIds = routeStationRepository.findStationIdsByRouteId(id);

        routeRepository.delete(route);
    }

        if (!stationIds.isEmpty()) {
            stationRepository.deleteAllById(stationIds);
    @Transactional(readOnly = true)
    public List<org.smartclinic.bus_system.DTOs.RouteStationResponseDTO> getRouteStations(Long routeId) {
        if (!routeRepository.existsById(routeId)) {
            throw new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Route not found");
        }

        return routeStationRepository.findByRouteIdOrderByOrderIndexAsc(routeId)
                .stream()
                .map(rs -> {
                    org.smartclinic.bus_system.DTOs.RouteStationResponseDTO dto = new org.smartclinic.bus_system.DTOs.RouteStationResponseDTO();
                    dto.setId(rs.getStation().getId());
                    dto.setName(rs.getStation().getName());
                    dto.setOrder(rs.getOrderIndex());
                    return dto;
                })
                .toList();
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