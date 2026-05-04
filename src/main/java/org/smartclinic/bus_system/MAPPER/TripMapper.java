package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.TripResponseDTO;
import org.smartclinic.bus_system.Entity.Trip;

public class TripMapper {
    public static TripResponseDTO toDTO(Trip t) {
        TripResponseDTO dto = new TripResponseDTO();
        dto.setId(t.getId());
        if (t.getRoute() != null) {
            dto.setRouteId(t.getRoute().getId());
            dto.setRouteName(t.getRoute().getName());
            dto.setRouteCode(t.getRoute().getCode());
        }
        if (t.getDriver() != null) {
            dto.setDriverId(t.getDriver().getId());
            if (t.getDriver().getUser() != null) {
                dto.setDriverUserId(t.getDriver().getUser().getId());
                dto.setDriverName(t.getDriver().getUser().getName());
            }
        }
        dto.setStartTime(t.getStartTime());
        dto.setEndTime(t.getEndTime());
        dto.setStatus(t.getStatus() != null ? t.getStatus().name() : null);
        dto.setCurrentStationIndex(t.getCurrentStationIndex());
        return dto;
    }
}
