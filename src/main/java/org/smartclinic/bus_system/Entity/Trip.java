package org.smartclinic.bus_system.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.smartclinic.bus_system.enums.TripStatus;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne
    private Route route;

    @ManyToOne
    private Driver driver;

    @Enumerated(EnumType.STRING)
    private TripStatus status;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private int currentStationIndex;
}
