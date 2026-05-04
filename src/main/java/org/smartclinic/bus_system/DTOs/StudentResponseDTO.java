package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentResponseDTO {
    private Long id;
    private Long userId;
    private String studentName;
    private Long boardingStationId;
    private String boardingStationName;
}
