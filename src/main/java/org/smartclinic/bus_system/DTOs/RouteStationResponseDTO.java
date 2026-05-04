package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RouteStationResponseDTO {
    private Long id;
    private Long stationId;
    private String name;
    private int orderIndex;
}
