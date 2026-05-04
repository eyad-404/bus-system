package org.smartclinic.bus_system.Repository;

import org.smartclinic.bus_system.Entity.RouteStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RouteStationRepository extends JpaRepository<RouteStation, Long> {

    List<RouteStation> findByRouteIdOrderByOrderIndexAsc(Long routeId);

    long countByRouteId(Long routeId);

    @Query("SELECT rs.station.id FROM RouteStation rs WHERE rs.route.id = :routeId")
    List<Long> findStationIdsByRouteId(@Param("routeId") Long routeId);

    @Query("SELECT MAX(rs.orderIndex) FROM RouteStation rs WHERE rs.route.id = :routeId")
    Optional<Integer> findMaxOrderIndexByRouteId(@Param("routeId") Long routeId);
}