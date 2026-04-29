package org.smartclinic.bus_system.Repository;

import org.smartclinic.bus_system.Entity.RouteStation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteStationRepository extends JpaRepository<RouteStation, Long> {

    List<RouteStation> findByRouteIdOrderByOrderIndexAsc(Long routeId);

    java.util.Optional<RouteStation> findByRouteIdAndStationId(Long routeId, Long stationId);

    java.util.Optional<RouteStation> findByRouteIdAndOrderIndex(Long routeId, Integer orderIndex);

    long countByRouteId(Long routeId);
}