package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripStatusResponseDTO {
    private Long tripId;
    private String status;
    private Long currentStationId;
    private String currentStationName;
    private Long routeId;
}
