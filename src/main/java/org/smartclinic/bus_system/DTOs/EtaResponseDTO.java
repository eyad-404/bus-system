package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EtaResponseDTO {
    private Long studentId;
    private Long tripId;
    private Integer etaMinutes;
}
