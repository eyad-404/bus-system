package org.smartclinic.bus_system.Repository;

import org.smartclinic.bus_system.Entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByUserId(Long userId);

    List<Student> findAllByBoardingStationId(Long stationId);

    List<Student> findAllByBoardingStationIsNull();
}
