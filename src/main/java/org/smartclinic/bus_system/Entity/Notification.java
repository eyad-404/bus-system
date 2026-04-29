package org.smartclinic.bus_system.Entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.*;
import org.smartclinic.bus_system.enums.NotificationType;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Trip trip;

    @ManyToOne
    private Station station;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private String message;

    private boolean isRead;

    private LocalDateTime createdAt;
}
