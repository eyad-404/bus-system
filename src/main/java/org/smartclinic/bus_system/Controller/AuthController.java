package org.smartclinic.bus_system.Controller;

import lombok.RequiredArgsConstructor;
import org.smartclinic.bus_system.DTOs.AuthResponseDTO;
import org.smartclinic.bus_system.DTOs.ChangePasswordRequestDTO;
import org.smartclinic.bus_system.DTOs.CreateUserDTO;
import org.smartclinic.bus_system.DTOs.LoginRequestDTO;
import org.smartclinic.bus_system.Service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody LoginRequestDTO request) {
        return authService.login(request);
    }

    @PostMapping("/register-admin")
    public void registerAdmin(@RequestBody CreateUserDTO dto) {
        authService.registerAdmin(dto);
    }

    @GetMapping("/has-admin")
    public boolean hasAdmin() {
        return authService.hasAdmin();
    }

    @PostMapping("/change-password")
    public void changePassword(@RequestBody ChangePasswordRequestDTO request,
                               Authentication authentication) {

        String email = authentication.getName();

        authService.changePassword(email, request.getNewPassword());
    }
}
