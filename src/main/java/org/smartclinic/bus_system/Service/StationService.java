package org.smartclinic.bus_system.Service;

import org.smartclinic.bus_system.DTOs.ReorderRequestDTO;
import org.smartclinic.bus_system.DTOs.RouteStationResponseDTO;
import org.smartclinic.bus_system.DTOs.StationRequestDTO;
import org.smartclinic.bus_system.Entity.Route;
import org.smartclinic.bus_system.Entity.RouteStation;
import org.smartclinic.bus_system.Entity.Station;
import org.smartclinic.bus_system.Repository.RouteRepository;
import org.smartclinic.bus_system.Repository.RouteStationRepository;
import org.smartclinic.bus_system.Repository.StationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class StationService {

    private final RouteRepository routeRepository;
    private final StationRepository stationRepository;
    private final RouteStationRepository routeStationRepository;

    public StationService(RouteRepository routeRepository,
                          StationRepository stationRepository,
                          RouteStationRepository routeStationRepository) {
        this.routeRepository = routeRepository;
        this.stationRepository = stationRepository;
        this.routeStationRepository = routeStationRepository;
    }

    @Transactional(readOnly = true)
    public List<RouteStationResponseDTO> getStationsForRoute(Long routeId) {
        requireRoute(routeId);
        return routeStationRepository.findByRouteIdOrderByOrderIndexAsc(routeId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public RouteStationResponseDTO addStation(Long routeId, StationRequestDTO dto) {
        Route route = requireRoute(routeId);

        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Station name is required");
        }

        Station station = new Station();
        station.setName(dto.getName().trim());
        station = stationRepository.save(station);

        int nextOrder = routeStationRepository.findMaxOrderIndexByRouteId(routeId).orElse(0) + 1;

        RouteStation rs = new RouteStation();
        rs.setRoute(route);
        rs.setStation(station);
        rs.setOrderIndex(nextOrder);
        rs = routeStationRepository.save(rs);

        return toDTO(rs);
    }

    @Transactional
    public RouteStationResponseDTO updateStation(Long routeId, Long routeStationId, StationRequestDTO dto) {
        requireRoute(routeId);

        RouteStation rs = routeStationRepository.findById(routeStationId)
                .filter(r -> r.getRoute().getId().equals(routeId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found in this route"));

        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Station name is required");
        }

        rs.getStation().setName(dto.getName().trim());
        stationRepository.save(rs.getStation());

        return toDTO(rs);
    }

    @Transactional
    public void deleteStation(Long routeId, Long routeStationId) {
        requireRoute(routeId);

        RouteStation rs = routeStationRepository.findById(routeStationId)
                .filter(r -> r.getRoute().getId().equals(routeId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found in this route"));

        Station stationToDelete = rs.getStation();
        routeStationRepository.delete(rs);
        stationRepository.delete(stationToDelete);

        List<RouteStation> remaining = routeStationRepository.findByRouteIdOrderByOrderIndexAsc(routeId);
        IntStream.range(0, remaining.size()).forEach(i -> remaining.get(i).setOrderIndex(i + 1));
        routeStationRepository.saveAll(remaining);
    }

    @Transactional
    public List<RouteStationResponseDTO> reorder(Long routeId, ReorderRequestDTO dto) {
        requireRoute(routeId);

        if (dto.getRouteStationIds() == null || dto.getRouteStationIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "routeStationIds list is required");
        }

        List<RouteStation> all = routeStationRepository.findByRouteIdOrderByOrderIndexAsc(routeId);
        Map<Long, RouteStation> byId = all.stream()
                .collect(Collectors.toMap(RouteStation::getId, Function.identity()));

        List<Long> ids = dto.getRouteStationIds();
        if (ids.size() != all.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reorder list size does not match station count");
        }

        IntStream.range(0, ids.size()).forEach(i -> {
            RouteStation rs = byId.get(ids.get(i));
            if (rs == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown routeStation id: " + ids.get(i));
            rs.setOrderIndex(i + 1);
        });

        routeStationRepository.saveAll(all);

        return routeStationRepository.findByRouteIdOrderByOrderIndexAsc(routeId)
                .stream().map(this::toDTO).toList();
    }

    private Route requireRoute(Long routeId) {
        return routeRepository.findById(routeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));
    }

    private RouteStationResponseDTO toDTO(RouteStation rs) {
        RouteStationResponseDTO dto = new RouteStationResponseDTO();
        dto.setId(rs.getId());
        dto.setStationId(rs.getStation().getId());
        dto.setName(rs.getStation().getName());
        dto.setOrderIndex(rs.getOrderIndex());
        return dto;
    }
}
