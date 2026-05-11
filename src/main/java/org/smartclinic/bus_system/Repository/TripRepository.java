package org.smartclinic.bus_system.Repository;

import org.smartclinic.bus_system.Entity.Trip;
import org.smartclinic.bus_system.enums.TripStatus;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {

    @Query("SELECT DISTINCT t FROM Trip t LEFT JOIN FETCH t.route WHERE t.id = :id")
    Optional<Trip> findByIdWithRoute(@Param("id") Long id);

    Optional<Trip> findByDriverIdAndStatus(Long driverId, TripStatus status);

    List<Trip> findAllByStatus(TripStatus status);

    Optional<Trip> findByRouteIdAndStatus(Long routeId, TripStatus status);

    List<Trip> findByDriverId(Long driverId);
}
