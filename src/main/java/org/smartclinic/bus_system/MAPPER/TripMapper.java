package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.TripResponseDTO;
import org.smartclinic.bus_system.Entity.Trip;

public class TripMapper {
    public static TripResponseDTO toDTO(Trip t){
        TripResponseDTO dto = new TripResponseDTO();
        dto.setId(t.getId());
        dto.setRouteId(t.getRoute() != null ? t.getRoute().getId() : null);
        dto.setDriverId(t.getDriver() != null ? t.getDriver().getId() : null);
        dto.setStatus(t.getStatus() != null ? t.getStatus().name() : null);
        dto.setCurrentStationIndex(t.getCurrentStationIndex());
        return dto;
    }
}
