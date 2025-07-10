import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'shooting_request.freezed.dart';
part 'shooting_request.g.dart';

enum RequestStatus {
  draft,
  submitted,
  adminApproved,
  equipmentAssigned,
  tripStarted,
  tripReturned,
  equipmentReturned,
  finished,
  rejected
}

enum TripStatus {
  notStarted,
  started,
  arrived,
  waiting,
  returningToOffice,
  returned
}

@freezed
class ShootingRequest with _$ShootingRequest {
  const factory ShootingRequest({
    required String id,
    required String projectTitle,
    required DateTime shootingDate,
    required String mainLocation,
    required int numberOfCameramen,
    String? notes,
    required String initiatorId,
    required String reporterId,
    required RequestStatus status,
    String? driverId,
    String? vehicleId,
    List<ExtraLocation>? extraLocations,
    List<Equipment>? assignedEquipment,
    TripStatus? tripStatus,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? adminApprovedAt,
    DateTime? equipmentAssignedAt,
    DateTime? tripStartedAt,
    DateTime? tripReturnedAt,
    DateTime? equipmentReturnedAt,
    DateTime? finishedAt,
  }) = _ShootingRequest;

  factory ShootingRequest.fromJson(Map<String, dynamic> json) => _$ShootingRequestFromJson(json);
}

@freezed
class ExtraLocation with _$ExtraLocation {
  const factory ExtraLocation({
    required String id,
    required String requestId,
    required String locationName,
    required bool isApproved,
    DateTime? approvedAt,
  }) = _ExtraLocation;

  factory ExtraLocation.fromJson(Map<String, dynamic> json) => _$ExtraLocationFromJson(json);
}

@freezed
class Equipment with _$Equipment {
  const factory Equipment({
    required String id,
    required String name,
    required String type,
    required bool isAssigned,
    String? assignedToRequestId,
    bool? isReturned,
    DateTime? returnedAt,
  }) = _Equipment;

  factory Equipment.fromJson(Map<String, dynamic> json) => _$EquipmentFromJson(json);
}

@freezed
class Vehicle with _$Vehicle {
  const factory Vehicle({
    required String id,
    required String model,
    required String licensePlate,
    required String driverId,
    required bool isAvailable,
    String? currentLocation,
    DateTime? lastUpdated,
  }) = _Vehicle;

  factory Vehicle.fromJson(Map<String, dynamic> json) => _$VehicleFromJson(json);
}