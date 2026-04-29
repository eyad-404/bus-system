package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserDTO {

    private String name;
    private String email;
    private String password;
    private String role;
}
