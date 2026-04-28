package org.smartclinic.bus_system.Repository;

import org.smartclinic.bus_system.Entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StationRepository extends JpaRepository<Station, Long> {

    @Query("""
        SELECT rs.station
        FROM RouteStation rs
        WHERE rs.route.id = :routeId
        ORDER BY rs.orderIndex ASC
    """)
    List<Station> findAllByRouteIdOrderByOrderIndexAsc(@Param("routeId") Long routeId);


    @Query("""
        SELECT st.boardingStation
        FROM Student st
        WHERE st.id = :studentId
    """)
    Station findBoardingStationByStudentId(@Param("studentId") Long studentId);


    @Query("""
        SELECT COUNT(rs)
        FROM RouteStation rs
        WHERE rs.route.id = :routeId
    """)
    long countByRouteId(@Param("routeId") Long routeId);
}
