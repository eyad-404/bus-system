package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.NotificationResponseDTO;
import org.smartclinic.bus_system.Entity.Notification;

public class NotificationMapper {
    public static NotificationResponseDTO toDTO(Notification n){
        NotificationResponseDTO dto = new NotificationResponseDTO();
        dto.setId(n.getId());
        dto.setMessage(n.getMessage());
        dto.setRead(n.isRead());
        dto.setType(n.getType().name());
        return dto;
    }
}
