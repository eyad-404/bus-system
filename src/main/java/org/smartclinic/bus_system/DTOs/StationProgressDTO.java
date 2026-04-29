package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StationProgressDTO {
    private Long stationId;
    private String stationName;
    private String status;
}
