package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripProgressRequestDTO {
    private Long tripId;
    private Long stationId;
}
