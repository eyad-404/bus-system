package org.smartclinic.bus_system.Repository;

import org.smartclinic.bus_system.Entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RouteRepository extends JpaRepository<Route, Long> {

    List<Route> findByNameContainingIgnoreCase(String name);

    Optional<Route> findByCode(String code);

    Optional<Route> findByDriverId(Long driverId);
}
