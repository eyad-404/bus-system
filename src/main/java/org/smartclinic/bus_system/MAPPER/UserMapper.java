package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.UserRequestDTO;
import org.smartclinic.bus_system.DTOs.UserResponseDTO;
import org.smartclinic.bus_system.Entity.User;
import org.smartclinic.bus_system.enums.Role;

public class UserMapper {
    public static User toEntity(UserRequestDTO dto){
        User user =new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole(Role.valueOf(dto.getRole()));
        return user;
    }
    public static UserResponseDTO toDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        return dto;
    }
}
