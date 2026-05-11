package org.smartclinic.bus_system.Service;

import org.smartclinic.bus_system.DTOs.NotificationResponseDTO;
import org.smartclinic.bus_system.Entity.Notification;
import org.smartclinic.bus_system.Entity.Station;
import org.smartclinic.bus_system.Entity.Student;
import org.smartclinic.bus_system.Entity.Trip;
import org.smartclinic.bus_system.MAPPER.NotificationMapper;
import org.smartclinic.bus_system.Repository.NotificationRepository;
import org.smartclinic.bus_system.Repository.RouteStationRepository;
import org.smartclinic.bus_system.Repository.StudentRepository;
import org.smartclinic.bus_system.enums.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final StudentRepository studentRepository;
    private final NotificationRepository notificationRepository;
    private final RouteStationRepository routeStationRepository;

    public NotificationService(StudentRepository studentRepository,
            NotificationRepository notificationRepository,
            RouteStationRepository routeStationRepository) {
        this.studentRepository = studentRepository;
        this.notificationRepository = notificationRepository;
        this.routeStationRepository = routeStationRepository;
    }

    @Transactional
    public void notifyStudentsForStation(Station station) {
        notifyStudentsForStation(station, null, false);
    }

    @Transactional
    public void notifyStudentsForStation(Station station, Trip trip, boolean approaching) {
        if (station == null || station.getId() == null) {
            return;
        }

        List<Student> students;
        if (trip != null && trip.getRoute() != null && trip.getRoute().getId() != null) {
            Long routeId = trip.getRoute().getId();
            boolean stationOnTripRoute = routeStationRepository.findByRouteIdAndStationId(routeId, station.getId())
                    .isPresent();
            if (!stationOnTripRoute) {
                return;
            }
            // Arrival: notify every student boarding at this stop (it is on this trip's path).
            // Approaching: same boarding stop, but only students assigned to this route (or unassigned).
            students = studentRepository.findAllByBoardingStationId(station.getId()).stream()
                    .filter(s -> !approaching || s.getRoute() == null || s.getRoute().getId().equals(routeId))
                    .toList();
        } else {
            students = studentRepository.findAllByBoardingStationId(station.getId());
        }
        LocalDateTime now = LocalDateTime.now();
        NotificationType type = approaching ? NotificationType.ALERT : NotificationType.ARRIVAL;
        String message = approaching
                ? "🚌 Bus is approaching " + station.getName() + " — get ready!"
                : "🚏 Bus has arrived at " + station.getName() + "!";
        String title = approaching ? "Bus Approaching" : "Bus Arrived";

        for (Student student : students) {
            if (student.getUser() == null) {
                continue;
            }

            Notification notification = new Notification();
            notification.setUser(student.getUser());
            notification.setTrip(trip);
            notification.setStation(station);
            notification.setType(type);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setRead(false);
            notification.setCreatedAt(now);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void notifyAllStudentsOnRoute(org.smartclinic.bus_system.Entity.Route route, Trip trip, String title,
            String message) {
        if (route == null || route.getId() == null) return;

        List<Long> stationIds = routeStationRepository
                .findByRouteIdOrderByOrderIndexAsc(route.getId())
                .stream()
                .map(rs -> rs.getStation().getId())
                .toList();

        List<Student> students = studentRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Student student : students) {
            boolean matchesRoute = (student.getRoute() != null && student.getRoute().getId().equals(route.getId()))
                    || (student.getBoardingStation() != null && stationIds.contains(student.getBoardingStation().getId()));

            if (matchesRoute && student.getUser() != null) {
                Notification notification = new Notification();
                notification.setUser(student.getUser());
                notification.setTrip(trip);
                notification.setType(NotificationType.ALERT);
                notification.setTitle(title);
                notification.setMessage(message);
                notification.setRead(false);
                notification.setCreatedAt(now);
                notificationRepository.save(notification);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationMapper::toDTO)
                .toList();
    }

    @Transactional
    public NotificationResponseDTO markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException(
                        "Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
        return NotificationMapper.toDTO(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}
