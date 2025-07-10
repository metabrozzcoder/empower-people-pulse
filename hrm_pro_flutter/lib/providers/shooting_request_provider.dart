import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hrm_pro_flutter/models/shooting_request.dart';
import 'package:hrm_pro_flutter/models/user.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

class ShootingRequestState {
  final List<ShootingRequest> requests;
  final List<ExtraLocation> extraLocations;
  final List<Equipment> equipment;
  final List<Vehicle> vehicles;
  final bool isLoading;
  final String? error;

  ShootingRequestState({
    required this.requests,
    required this.extraLocations,
    required this.equipment,
    required this.vehicles,
    this.isLoading = false,
    this.error,
  });

  ShootingRequestState copyWith({
    List<ShootingRequest>? requests,
    List<ExtraLocation>? extraLocations,
    List<Equipment>? equipment,
    List<Vehicle>? vehicles,
    bool? isLoading,
    String? error,
  }) {
    return ShootingRequestState(
      requests: requests ?? this.requests,
      extraLocations: extraLocations ?? this.extraLocations,
      equipment: equipment ?? this.equipment,
      vehicles: vehicles ?? this.vehicles,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ShootingRequestNotifier extends StateNotifier<ShootingRequestState> {
  final Uuid _uuid = const Uuid();

  ShootingRequestNotifier()
      : super(ShootingRequestState(
          requests: _mockRequests,
          extraLocations: _mockExtraLocations,
          equipment: _mockEquipment,
          vehicles: _mockVehicles,
        ));

  // Create a new shooting request
  void createRequest({
    required String projectTitle,
    required DateTime shootingDate,
    required String mainLocation,
    required int numberOfCameramen,
    String? notes,
    required String initiatorId,
    required String reporterId,
  }) {
    final newRequest = ShootingRequest(
      id: _uuid.v4(),
      projectTitle: projectTitle,
      shootingDate: shootingDate,
      mainLocation: mainLocation,
      numberOfCameramen: numberOfCameramen,
      notes: notes,
      initiatorId: initiatorId,
      reporterId: reporterId,
      status: RequestStatus.draft,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    state = state.copyWith(
      requests: [...state.requests, newRequest],
    );
  }

  // Submit request for admin approval
  void submitRequest(String requestId) {
    final updatedRequests = state.requests.map((request) {
      if (request.id == requestId) {
        return request.copyWith(
          status: RequestStatus.submitted,
          updatedAt: DateTime.now(),
        );
      }
      return request;
    }).toList();

    state = state.copyWith(requests: updatedRequests);
  }

  // Admin approves request and assigns driver
  void approveRequest(String requestId, String driverId) {
    final updatedRequests = state.requests.map((request) {
      if (request.id == requestId) {
        // Find the vehicle for this driver
        final driverVehicle = state.vehicles.firstWhere(
          (vehicle) => vehicle.driverId == driverId,
          orElse: () => state.vehicles.first, // Fallback
        );

        return request.copyWith(
          status: RequestStatus.adminApproved,
          driverId: driverId,
          vehicleId: driverVehicle.id,
          adminApprovedAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      }
      return request;
    }).toList();

    state = state.copyWith(requests: updatedRequests);
  }

  // Admin rejects request
  void rejectRequest(String requestId) {
    final updatedRequests = state.requests.map((request) {
      if (request.id == requestId) {
        return request.copyWith(
          status: RequestStatus.rejected,
          updatedAt: DateTime.now(),
        );
      }
      return request;
    }).toList();

    state = state.copyWith(requests: updatedRequests);
  }

  // Equipment department assigns equipment
  void assignEquipment(String requestId, List<String> equipmentIds) {
    // Update the request status
    final updatedRequests = state.requests.map((request) {
      if (request.id == requestId) {
        return request.copyWith(
          status: RequestStatus.equipmentAssigned,
          equipmentAssignedAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      }
      return request;
    }).toList();

    // Update the equipment status
    final updatedEquipment = state.equipment.map((item) {
      if (equipmentIds.contains(item.id)) {
        return item.copyWith(
          isAssigned: true,
          assignedToRequestId: requestId,
          isReturned: false,
        );
      }
      return item;
    }).toList();

    state = state.copyWith(
      requests: updatedRequests,
      equipment: updatedEquipment,
    );
  }

  // Reporter adds extra location
  void addExtraLocation(String requestId, String locationName) {
    final newLocation = ExtraLocation(
      id: _uuid.v4(),
      requestId: requestId,
      locationName: locationName,
      isApproved: false,
    );

    state = state.copyWith(
      extraLocations: [...state.extraLocations, newLocation],
    );
  }

  // Admin approves extra location
  void approveExtraLocation(String locationId) {
    final updatedLocations = state.extraLocations.map((location) {
      if (location.id == locationId) {
        return location.copyWith(
          isApproved: true,
          approvedAt: DateTime.now(),
        );
      }
      return location;
    }).toList();

    state = state.copyWith(extraLocations: updatedLocations);
  }

  // Driver updates trip status
  void updateTripStatus(String requestId, TripStatus tripStatus) {
    final updatedRequests = state.requests.map((request) {
      if (request.id == requestId) {
        final now = DateTime.now();
        
        // Update request status based on trip status
        RequestStatus? newStatus;
        DateTime? tripStartedAt;
        DateTime? tripReturnedAt;
        
        if (tripStatus == TripStatus.started && request.tripStatus == TripStatus.notStarted) {
          newStatus = RequestStatus.tripStarted;
          tripStartedAt = now;
        } else if (tripStatus == TripStatus.returned) {
          newStatus = RequestStatus.tripReturned;
          tripReturnedAt = now;
        }

        return request.copyWith(
          status: newStatus ?? request.status,
          tripStatus: tripStatus,
          tripStartedAt: tripStartedAt ?? request.tripStartedAt,
          tripReturnedAt: tripReturnedAt ?? request.tripReturnedAt,
          updatedAt: now,
        );
      }
      return request;
    }).toList();

    state = state.copyWith(requests: updatedRequests);
  }

  // Equipment department confirms equipment return
  void confirmEquipmentReturn(String requestId) {
    // Update the request status
    final updatedRequests = state.requests.map((request) {
      if (request.id == requestId) {
        return request.copyWith(
          status: RequestStatus.equipmentReturned,
          equipmentReturnedAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      }
      return request;
    }).toList();

    // Update the equipment status
    final updatedEquipment = state.equipment.map((item) {
      if (item.assignedToRequestId == requestId) {
        return item.copyWith(
          isReturned: true,
          returnedAt: DateTime.now(),
          isAssigned: false,
          assignedToRequestId: null,
        );
      }
      return item;
    }).toList();

    state = state.copyWith(
      requests: updatedRequests,
      equipment: updatedEquipment,
    );
  }

  // Reporter finalizes request
  void finalizeRequest(String requestId) {
    final updatedRequests = state.requests.map((request) {
      if (request.id == requestId) {
        return request.copyWith(
          status: RequestStatus.finished,
          finishedAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      }
      return request;
    }).toList();

    state = state.copyWith(requests: updatedRequests);
  }

  // Get requests by user job position
  List<ShootingRequest> getRequestsByJobPosition(String jobPosition, String userId) {
    switch (jobPosition) {
      case 'Reporter':
        return state.requests.where((r) => r.reporterId == userId).toList();
      case 'Admin':
      case 'Head of Reporters':
        return state.requests.where((r) => 
          r.status == RequestStatus.submitted || 
          r.status == RequestStatus.adminApproved
        ).toList();
      case 'Equipment Department':
        return state.requests.where((r) => 
          r.status == RequestStatus.adminApproved || 
          r.status == RequestStatus.tripReturned
        ).toList();
      case 'Driver':
        return state.requests.where((r) => 
          r.driverId == userId && 
          r.status == RequestStatus.equipmentAssigned
        ).toList();
      default:
        return [];
    }
  }

  // Get extra locations for a request
  List<ExtraLocation> getExtraLocationsForRequest(String requestId) {
    return state.extraLocations.where((location) => location.requestId == requestId).toList();
  }

  // Get assigned equipment for a request
  List<Equipment> getAssignedEquipmentForRequest(String requestId) {
    return state.equipment.where((item) => item.assignedToRequestId == requestId).toList();
  }

  // Get vehicle for a request
  Vehicle? getVehicleForRequest(String requestId) {
    final request = state.requests.firstWhere((r) => r.id == requestId, orElse: () => null as ShootingRequest);
    if (request == null || request.vehicleId == null) return null;
    
    return state.vehicles.firstWhere(
      (v) => v.id == request.vehicleId,
      orElse: () => null as Vehicle,
    );
  }
}

final shootingRequestProvider = StateNotifierProvider<ShootingRequestNotifier, ShootingRequestState>((ref) {
  return ShootingRequestNotifier();
});

// Mock data
final List<ShootingRequest> _mockRequests = [
  ShootingRequest(
    id: '1',
    projectTitle: 'Downtown Market Feature',
    shootingDate: DateTime.now().add(const Duration(days: 2)),
    mainLocation: 'Central Market, Downtown',
    numberOfCameramen: 2,
    notes: 'Focus on local vendors and seasonal produce',
    initiatorId: '3', // Emily Davis
    reporterId: '2', // John Smith
    status: RequestStatus.submitted,
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
    updatedAt: DateTime.now().subtract(const Duration(days: 1)),
  ),
  ShootingRequest(
    id: '2',
    projectTitle: 'City Council Meeting',
    shootingDate: DateTime.now().add(const Duration(days: 1)),
    mainLocation: 'City Hall, Room 302',
    numberOfCameramen: 1,
    notes: 'Budget discussion, mayor will be present',
    initiatorId: '4', // David Chen
    reporterId: '2', // John Smith
    status: RequestStatus.adminApproved,
    driverId: '5', // Lisa Brown
    vehicleId: '1', // News Van 1
    adminApprovedAt: DateTime.now().subtract(const Duration(hours: 4)),
    createdAt: DateTime.now().subtract(const Duration(days: 2)),
    updatedAt: DateTime.now().subtract(const Duration(hours: 4)),
  ),
  ShootingRequest(
    id: '3',
    projectTitle: 'Tech Conference Coverage',
    shootingDate: DateTime.now().add(const Duration(days: 5)),
    mainLocation: 'Convention Center, Hall B',
    numberOfCameramen: 3,
    notes: 'Full day event, multiple interviews scheduled',
    initiatorId: '3', // Emily Davis
    reporterId: '6', // Robert Taylor
    status: RequestStatus.equipmentAssigned,
    driverId: '7', // James Park
    vehicleId: '2', // News Van 2
    adminApprovedAt: DateTime.now().subtract(const Duration(days: 1)),
    equipmentAssignedAt: DateTime.now().subtract(const Duration(hours: 2)),
    createdAt: DateTime.now().subtract(const Duration(days: 3)),
    updatedAt: DateTime.now().subtract(const Duration(hours: 2)),
    tripStatus: TripStatus.notStarted,
  ),
  ShootingRequest(
    id: '4',
    projectTitle: 'Local Sports Championship',
    shootingDate: DateTime.now().subtract(const Duration(days: 1)),
    mainLocation: 'City Stadium',
    numberOfCameramen: 2,
    notes: 'Post-game interviews with coaches and players',
    initiatorId: '4', // David Chen
    reporterId: '6', // Robert Taylor
    status: RequestStatus.tripReturned,
    driverId: '5', // Lisa Brown
    vehicleId: '1', // News Van 1
    adminApprovedAt: DateTime.now().subtract(const Duration(days: 3)),
    equipmentAssignedAt: DateTime.now().subtract(const Duration(days: 2)),
    tripStartedAt: DateTime.now().subtract(const Duration(days: 1, hours: 4)),
    tripReturnedAt: DateTime.now().subtract(const Duration(hours: 6)),
    createdAt: DateTime.now().subtract(const Duration(days: 4)),
    updatedAt: DateTime.now().subtract(const Duration(hours: 6)),
    tripStatus: TripStatus.returned,
  ),
  ShootingRequest(
    id: '5',
    projectTitle: 'Mayor Interview',
    shootingDate: DateTime.now().subtract(const Duration(days: 3)),
    mainLocation: 'Mayor\'s Office',
    numberOfCameramen: 1,
    notes: 'Exclusive interview about new city initiatives',
    initiatorId: '3', // Emily Davis
    reporterId: '2', // John Smith
    status: RequestStatus.finished,
    driverId: '7', // James Park
    vehicleId: '2', // News Van 2
    adminApprovedAt: DateTime.now().subtract(const Duration(days: 5)),
    equipmentAssignedAt: DateTime.now().subtract(const Duration(days: 4)),
    tripStartedAt: DateTime.now().subtract(const Duration(days: 3, hours: 4)),
    tripReturnedAt: DateTime.now().subtract(const Duration(days: 3, hours: 1)),
    equipmentReturnedAt: DateTime.now().subtract(const Duration(days: 3)),
    finishedAt: DateTime.now().subtract(const Duration(days: 2)),
    createdAt: DateTime.now().subtract(const Duration(days: 6)),
    updatedAt: DateTime.now().subtract(const Duration(days: 2)),
    tripStatus: TripStatus.returned,
  ),
];

final List<ExtraLocation> _mockExtraLocations = [
  ExtraLocation(
    id: '1',
    requestId: '1',
    locationName: 'Farmer\'s Co-op Office',
    isApproved: false,
  ),
  ExtraLocation(
    id: '2',
    requestId: '2',
    locationName: 'Press Conference Room',
    isApproved: true,
    approvedAt: DateTime.now().subtract(const Duration(hours: 3)),
  ),
  ExtraLocation(
    id: '3',
    requestId: '3',
    locationName: 'Startup Alley',
    isApproved: true,
    approvedAt: DateTime.now().subtract(const Duration(hours: 1)),
  ),
  ExtraLocation(
    id: '4',
    requestId: '3',
    locationName: 'VIP Lounge',
    isApproved: false,
  ),
];

final List<Equipment> _mockEquipment = [
  Equipment(
    id: '1',
    name: 'Sony PXW-Z280',
    type: 'Camera',
    isAssigned: true,
    assignedToRequestId: '3',
    isReturned: false,
  ),
  Equipment(
    id: '2',
    name: 'Canon C300 Mark III',
    type: 'Camera',
    isAssigned: true,
    assignedToRequestId: '3',
    isReturned: false,
  ),
  Equipment(
    id: '3',
    name: 'Sennheiser MKH 416',
    type: 'Microphone',
    isAssigned: true,
    assignedToRequestId: '3',
    isReturned: false,
  ),
  Equipment(
    id: '4',
    name: 'DJI Ronin-S',
    type: 'Stabilizer',
    isAssigned: false,
    isReturned: true,
    returnedAt: DateTime.now().subtract(const Duration(days: 2)),
  ),
  Equipment(
    id: '5',
    name: 'Aputure 300d II',
    type: 'Light',
    isAssigned: false,
    isReturned: true,
    returnedAt: DateTime.now().subtract(const Duration(days: 3)),
  ),
];

final List<Vehicle> _mockVehicles = [
  Vehicle(
    id: '1',
    model: 'Ford Transit',
    licensePlate: 'NEWS-001',
    driverId: '5', // Lisa Brown
    isAvailable: true,
    currentLocation: '37.7749,-122.4194', // San Francisco coordinates
    lastUpdated: DateTime.now().subtract(const Duration(minutes: 15)),
  ),
  Vehicle(
    id: '2',
    model: 'Mercedes Sprinter',
    licensePlate: 'NEWS-002',
    driverId: '7', // James Park
    isAvailable: false,
    currentLocation: '37.3382,-121.8863', // San Jose coordinates
    lastUpdated: DateTime.now().subtract(const Duration(minutes: 5)),
  ),
];