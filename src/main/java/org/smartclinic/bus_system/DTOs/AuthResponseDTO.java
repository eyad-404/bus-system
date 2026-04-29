package org.smartclinic.bus_system.DTOs;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponseDTO {

    private String token;
    private String role;
    private boolean firstLogin;
}