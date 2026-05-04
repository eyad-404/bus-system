package org.smartclinic.bus_system.Repository;

import org.smartclinic.bus_system.Entity.TripProgress;
import org.smartclinic.bus_system.enums.ProgressStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TripProgressRepository extends JpaRepository<TripProgress, Long> {

    List<TripProgress> findByTripId(Long tripId);

    Optional<TripProgress> findByTripIdAndStatus(Long tripId, ProgressStatus status);

    Optional<TripProgress> findByTripIdAndStationId(Long tripId, Long stationId);
}