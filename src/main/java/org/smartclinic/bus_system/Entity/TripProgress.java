package org.smartclinic.bus_system.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.smartclinic.bus_system.enums.ProgressStatus;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class TripProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne
    private Trip trip;

    @ManyToOne
    private Station station;

    @Enumerated(EnumType.STRING)
    private ProgressStatus status;

    private LocalDateTime arrivalTime;

    private Boolean hasArrived = false;
}
