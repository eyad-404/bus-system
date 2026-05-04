package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationResponseDTO {
    private Long id;
    private String title;
    private String message;
    private boolean isRead;
    private String type;
    private java.time.LocalDateTime createdAt;
}