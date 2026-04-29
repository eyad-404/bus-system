package org.smartclinic.bus_system.Repository;

import org.smartclinic.bus_system.Entity.User;
import org.smartclinic.bus_system.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findAllByRole(Role role);

    boolean existsByRole(Role role);

    @Query("""
        SELECT u
        FROM User u
        WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
    """)
    List<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(@Param("query") String query);
}
