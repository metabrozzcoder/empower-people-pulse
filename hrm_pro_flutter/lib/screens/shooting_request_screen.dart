import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hrm_pro_flutter/models/shooting_request.dart';
import 'package:hrm_pro_flutter/providers/auth_provider.dart';
import 'package:hrm_pro_flutter/providers/shooting_request_provider.dart';
import 'package:hrm_pro_flutter/utils/constants.dart';
import 'package:intl/intl.dart';

class ShootingRequestScreen extends ConsumerStatefulWidget {
  const ShootingRequestScreen({super.key});

  @override
  ConsumerState<ShootingRequestScreen> createState() => _ShootingRequestScreenState();
}

class _ShootingRequestScreenState extends ConsumerState<ShootingRequestScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedFilter = 'all';
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  String _getStatusText(RequestStatus status) {
    switch (status) {
      case RequestStatus.draft:
        return 'Draft';
      case RequestStatus.submitted:
        return 'Submitted';
      case RequestStatus.adminApproved:
        return 'Admin Approved';
      case RequestStatus.equipmentAssigned:
        return 'Equipment Assigned';
      case RequestStatus.tripStarted:
        return 'Trip Started';
      case RequestStatus.tripReturned:
        return 'Trip Returned';
      case RequestStatus.equipmentReturned:
        return 'Equipment Returned';
      case RequestStatus.finished:
        return 'Finished';
      case RequestStatus.rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }
  
  Color _getStatusColor(RequestStatus status) {
    switch (status) {
      case RequestStatus.draft:
        return Colors.grey;
      case RequestStatus.submitted:
        return Colors.blue;
      case RequestStatus.adminApproved:
        return Colors.green;
      case RequestStatus.equipmentAssigned:
        return Colors.purple;
      case RequestStatus.tripStarted:
        return Colors.orange;
      case RequestStatus.tripReturned:
        return Colors.teal;
      case RequestStatus.equipmentReturned:
        return Colors.indigo;
      case RequestStatus.finished:
        return Colors.green.shade800;
      case RequestStatus.rejected:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
  
  List<ShootingRequest> _filterRequests(List<ShootingRequest> requests) {
    if (_selectedFilter == 'all') {
      return requests;
    } else if (_selectedFilter == 'active') {
      return requests.where((r) => 
        r.status != RequestStatus.finished && 
        r.status != RequestStatus.rejected
      ).toList();
    } else if (_selectedFilter == 'completed') {
      return requests.where((r) => r.status == RequestStatus.finished).toList();
    } else if (_selectedFilter == 'rejected') {
      return requests.where((r) => r.status == RequestStatus.rejected).toList();
    } else if (_selectedFilter == 'pending') {
      return requests.where((r) => 
        r.status == RequestStatus.submitted || 
        r.status == RequestStatus.adminApproved ||
        r.status == RequestStatus.equipmentAssigned
      ).toList();
    } else {
      return requests;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(currentUserProvider);
    final shootingRequestState = ref.watch(shootingRequestProvider);
    
    // Determine job position from user role (in a real app, this would be a separate field)
    String jobPosition = 'Reporter'; // Default
    if (currentUser?.role == 'Admin') {
      jobPosition = 'Admin';
    } else if (currentUser?.username == 'john.smith') {
      jobPosition = 'Reporter';
    } else if (currentUser?.username == 'equipment.dept') {
      jobPosition = 'Equipment Department';
    } else if (currentUser?.username == 'driver') {
      jobPosition = 'Driver';
    }
    
    // Get requests based on job position
    final requests = ref.read(shootingRequestProvider.notifier)
        .getRequestsByJobPosition(jobPosition, currentUser?.id ?? '');
    
    final filteredRequests = _filterRequests(requests);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shooting Requests'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'All Requests'),
            Tab(text: 'My Requests'),
            Tab(text: 'Pending Action'),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                _selectedFilter = value;
              });
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'all',
                child: Text('All Statuses'),
              ),
              const PopupMenuItem(
                value: 'active',
                child: Text('Active'),
              ),
              const PopupMenuItem(
                value: 'pending',
                child: Text('Pending'),
              ),
              const PopupMenuItem(
                value: 'completed',
                child: Text('Completed'),
              ),
              const PopupMenuItem(
                value: 'rejected',
                child: Text('Rejected'),
              ),
            ],
            icon: const Icon(Icons.filter_list),
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // All Requests Tab
          _buildRequestList(filteredRequests, jobPosition),
          
          // My Requests Tab (filter by current user)
          _buildRequestList(
            filteredRequests.where((r) => 
              jobPosition == 'Reporter' ? r.reporterId == currentUser?.id :
              jobPosition == 'Driver' ? r.driverId == currentUser?.id :
              r.initiatorId == currentUser?.id
            ).toList(),
            jobPosition
          ),
          
          // Pending Action Tab
          _buildRequestList(
            filteredRequests.where((r) => 
              jobPosition == 'Reporter' && r.status == RequestStatus.equipmentReturned ||
              jobPosition == 'Admin' && r.status == RequestStatus.submitted ||
              jobPosition == 'Equipment Department' && (r.status == RequestStatus.adminApproved || r.status == RequestStatus.tripReturned) ||
              jobPosition == 'Driver' && r.status == RequestStatus.equipmentAssigned
            ).toList(),
            jobPosition
          ),
        ],
      ),
      floatingActionButton: jobPosition == 'Reporter'
          ? FloatingActionButton(
              onPressed: () {
                _showCreateRequestDialog(context);
              },
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
  
  Widget _buildRequestList(List<ShootingRequest> requests, String jobPosition) {
    if (requests.isEmpty) {
      return const Center(
        child: Text('No requests found'),
      );
    }
    
    return ListView.builder(
      itemCount: requests.length,
      itemBuilder: (context, index) {
        final request = requests[index];
        return Card(
          margin: const EdgeInsets.all(8.0),
          child: ListTile(
            title: Text(request.projectTitle),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Date: ${DateFormat('MMM dd, yyyy').format(request.shootingDate)}'),
                Text('Location: ${request.mainLocation}'),
                Text('Cameramen: ${request.numberOfCameramen}'),
              ],
            ),
            trailing: Chip(
              label: Text(_getStatusText(request.status)),
              backgroundColor: _getStatusColor(request.status).withOpacity(0.2),
              labelStyle: TextStyle(color: _getStatusColor(request.status)),
            ),
            onTap: () {
              _showRequestDetailsDialog(context, request, jobPosition);
            },
          ),
        );
      },
    );
  }
  
  void _showCreateRequestDialog(BuildContext context) {
    final currentUser = ref.read(currentUserProvider);
    final formKey = GlobalKey<FormState>();
    
    String projectTitle = '';
    DateTime shootingDate = DateTime.now().add(const Duration(days: 1));
    String mainLocation = '';
    int numberOfCameramen = 1;
    String notes = '';
    String initiatorId = '';
    
    // Get list of users who can be initiators
    final users = [
      {'id': '3', 'name': 'Emily Davis'},
      {'id': '4', 'name': 'David Chen'},
      {'id': '8', 'name': 'Alex Wilson'},
    ];
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Shooting Request'),
        content: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Project Title'),
                  validator: (value) => value!.isEmpty ? 'Required' : null,
                  onChanged: (value) => projectTitle = value,
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: shootingDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      setState(() {
                        shootingDate = date;
                      });
                    }
                  },
                  child: InputDecorator(
                    decoration: const InputDecoration(labelText: 'Shooting Date'),
                    child: Text(DateFormat('MMM dd, yyyy').format(shootingDate)),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Main Location'),
                  validator: (value) => value!.isEmpty ? 'Required' : null,
                  onChanged: (value) => mainLocation = value,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<int>(
                  decoration: const InputDecoration(labelText: 'Number of Cameramen'),
                  value: numberOfCameramen,
                  items: [1, 2, 3, 4, 5].map((number) {
                    return DropdownMenuItem<int>(
                      value: number,
                      child: Text('$number'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      numberOfCameramen = value;
                    }
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Initiator'),
                  items: users.map((user) {
                    return DropdownMenuItem<String>(
                      value: user['id'],
                      child: Text(user['name']!),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      initiatorId = value;
                    }
                  },
                  validator: (value) => value == null ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Notes (Optional)'),
                  maxLines: 3,
                  onChanged: (value) => notes = value,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (formKey.currentState!.validate()) {
                ref.read(shootingRequestProvider.notifier).createRequest(
                  projectTitle: projectTitle,
                  shootingDate: shootingDate,
                  mainLocation: mainLocation,
                  numberOfCameramen: numberOfCameramen,
                  notes: notes.isNotEmpty ? notes : null,
                  initiatorId: initiatorId,
                  reporterId: currentUser?.id ?? '2', // Default to John Smith if not logged in
                );
                Navigator.pop(context);
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Request created successfully')),
                );
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
  
  void _showRequestDetailsDialog(BuildContext context, ShootingRequest request, String jobPosition) {
    // Get extra locations for this request
    final extraLocations = ref.read(shootingRequestProvider.notifier)
        .getExtraLocationsForRequest(request.id);
    
    // Get assigned equipment for this request
    final assignedEquipment = ref.read(shootingRequestProvider.notifier)
        .getAssignedEquipmentForRequest(request.id);
    
    // Get vehicle for this request
    final vehicle = ref.read(shootingRequestProvider.notifier)
        .getVehicleForRequest(request.id);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(request.projectTitle),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Status
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(request.status).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  _getStatusText(request.status),
                  style: TextStyle(color: _getStatusColor(request.status)),
                ),
              ),
              const SizedBox(height: 16),
              
              // Basic Info
              _buildInfoRow('Shooting Date', DateFormat('MMM dd, yyyy').format(request.shootingDate)),
              _buildInfoRow('Main Location', request.mainLocation),
              _buildInfoRow('Cameramen', request.numberOfCameramen.toString()),
              if (request.notes != null && request.notes!.isNotEmpty)
                _buildInfoRow('Notes', request.notes!),
              
              // Extra Locations
              if (extraLocations.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text('Extra Locations:', style: TextStyle(fontWeight: FontWeight.bold)),
                ...extraLocations.map((location) => Padding(
                  padding: const EdgeInsets.only(left: 16, top: 4),
                  child: Row(
                    children: [
                      Text(location.locationName),
                      const SizedBox(width: 8),
                      location.isApproved
                          ? const Icon(Icons.check_circle, color: Colors.green, size: 16)
                          : const Icon(Icons.pending, color: Colors.orange, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        location.isApproved ? 'Approved' : 'Pending',
                        style: TextStyle(
                          color: location.isApproved ? Colors.green : Colors.orange,
                          fontSize: 12,
                        ),
                      ),
                      
                      // Admin can approve extra locations
                      if (jobPosition == 'Admin' && !location.isApproved)
                        TextButton(
                          onPressed: () {
                            ref.read(shootingRequestProvider.notifier).approveExtraLocation(location.id);
                            Navigator.pop(context);
                            
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Location approved')),
                            );
                          },
                          child: const Text('Approve'),
                        ),
                    ],
                  ),
                )),
              ],
              
              // Assigned Equipment
              if (assignedEquipment.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text('Assigned Equipment:', style: TextStyle(fontWeight: FontWeight.bold)),
                ...assignedEquipment.map((equipment) => Padding(
                  padding: const EdgeInsets.only(left: 16, top: 4),
                  child: Row(
                    children: [
                      Text('${equipment.name} (${equipment.type})'),
                      const SizedBox(width: 8),
                      equipment.isReturned == true
                          ? const Icon(Icons.check_circle, color: Colors.green, size: 16)
                          : const Icon(Icons.pending, color: Colors.orange, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        equipment.isReturned == true ? 'Returned' : 'Not Returned',
                        style: TextStyle(
                          color: equipment.isReturned == true ? Colors.green : Colors.orange,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                )),
              ],
              
              // Vehicle Info
              if (vehicle != null) ...[
                const SizedBox(height: 16),
                const Text('Vehicle:', style: TextStyle(fontWeight: FontWeight.bold)),
                Padding(
                  padding: const EdgeInsets.only(left: 16, top: 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${vehicle.model} (${vehicle.licensePlate})'),
                      if (vehicle.currentLocation != null)
                        Text('Current Location: ${vehicle.currentLocation}'),
                    ],
                  ),
                ),
              ],
              
              // Trip Status
              if (request.tripStatus != null) ...[
                const SizedBox(height: 16),
                const Text('Trip Status:', style: TextStyle(fontWeight: FontWeight.bold)),
                Padding(
                  padding: const EdgeInsets.only(left: 16, top: 4),
                  child: Text(_getTripStatusText(request.tripStatus!)),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          
          // Reporter actions
          if (jobPosition == 'Reporter') ...[
            // Submit request
            if (request.status == RequestStatus.draft)
              ElevatedButton(
                onPressed: () {
                  ref.read(shootingRequestProvider.notifier).submitRequest(request.id);
                  Navigator.pop(context);
                  
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Request submitted for approval')),
                  );
                },
                child: const Text('Submit'),
              ),
              
            // Add extra location
            if (request.status != RequestStatus.finished && request.status != RequestStatus.rejected)
              ElevatedButton(
                onPressed: () {
                  _showAddExtraLocationDialog(context, request.id);
                },
                child: const Text('Add Location'),
              ),
              
            // Finalize request
            if (request.status == RequestStatus.equipmentReturned)
              ElevatedButton(
                onPressed: () {
                  ref.read(shootingRequestProvider.notifier).finalizeRequest(request.id);
                  Navigator.pop(context);
                  
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Request finalized')),
                  );
                },
                child: const Text('Finalize'),
              ),
          ],
          
          // Admin actions
          if (jobPosition == 'Admin' && request.status == RequestStatus.submitted) ...[
            TextButton(
              onPressed: () {
                ref.read(shootingRequestProvider.notifier).rejectRequest(request.id);
                Navigator.pop(context);
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Request rejected')),
                );
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Reject'),
            ),
            ElevatedButton(
              onPressed: () {
                _showAssignDriverDialog(context, request.id);
              },
              child: const Text('Approve & Assign Driver'),
            ),
          ],
          
          // Equipment Department actions
          if (jobPosition == 'Equipment Department') ...[
            // Assign equipment
            if (request.status == RequestStatus.adminApproved)
              ElevatedButton(
                onPressed: () {
                  _showAssignEquipmentDialog(context, request.id, request.numberOfCameramen);
                },
                child: const Text('Assign Equipment'),
              ),
              
            // Confirm equipment return
            if (request.status == RequestStatus.tripReturned)
              ElevatedButton(
                onPressed: () {
                  ref.read(shootingRequestProvider.notifier).confirmEquipmentReturn(request.id);
                  Navigator.pop(context);
                  
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Equipment return confirmed')),
                  );
                },
                child: const Text('Confirm Return'),
              ),
          ],
          
          // Driver actions
          if (jobPosition == 'Driver' && request.status == RequestStatus.equipmentAssigned) ...[
            ElevatedButton(
              onPressed: () {
                _showUpdateTripStatusDialog(context, request);
              },
              child: const Text('Update Trip Status'),
            ),
          ],
        ],
      ),
    );
  }
  
  String _getTripStatusText(TripStatus status) {
    switch (status) {
      case TripStatus.notStarted:
        return 'Not Started';
      case TripStatus.started:
        return 'Started';
      case TripStatus.arrived:
        return 'Arrived at Location';
      case TripStatus.waiting:
        return 'Waiting';
      case TripStatus.returningToOffice:
        return 'Returning to Office';
      case TripStatus.returned:
        return 'Returned';
      default:
        return 'Unknown';
    }
  }
  
  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
  
  void _showAddExtraLocationDialog(BuildContext context, String requestId) {
    String locationName = '';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Extra Location'),
        content: TextField(
          decoration: const InputDecoration(labelText: 'Location Name'),
          onChanged: (value) => locationName = value,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (locationName.isNotEmpty) {
                ref.read(shootingRequestProvider.notifier).addExtraLocation(requestId, locationName);
                Navigator.pop(context);
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Extra location added (pending approval)')),
                );
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
  
  void _showAssignDriverDialog(BuildContext context, String requestId) {
    String driverId = '';
    
    // Get list of drivers
    final drivers = [
      {'id': '5', 'name': 'Lisa Brown'},
      {'id': '7', 'name': 'James Park'},
    ];
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Approve & Assign Driver'),
        content: DropdownButtonFormField<String>(
          decoration: const InputDecoration(labelText: 'Select Driver'),
          items: drivers.map((driver) {
            return DropdownMenuItem<String>(
              value: driver['id'],
              child: Text(driver['name']!),
            );
          }).toList(),
          onChanged: (value) {
            if (value != null) {
              driverId = value;
            }
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (driverId.isNotEmpty) {
                ref.read(shootingRequestProvider.notifier).approveRequest(requestId, driverId);
                Navigator.pop(context);
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Request approved and driver assigned')),
                );
              }
            },
            child: const Text('Approve & Assign'),
          ),
        ],
      ),
    );
  }
  
  void _showAssignEquipmentDialog(BuildContext context, String requestId, int numberOfCameramen) {
    final availableEquipment = ref.read(shootingRequestProvider).equipment
        .where((e) => !e.isAssigned)
        .toList();
    
    final selectedEquipment = <String>[];
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: const Text('Assign Equipment'),
            content: SizedBox(
              width: double.maxFinite,
              child: ListView(
                shrinkWrap: true,
                children: availableEquipment.map((equipment) {
                  return CheckboxListTile(
                    title: Text(equipment.name),
                    subtitle: Text(equipment.type),
                    value: selectedEquipment.contains(equipment.id),
                    onChanged: (value) {
                      setState(() {
                        if (value == true) {
                          selectedEquipment.add(equipment.id);
                        } else {
                          selectedEquipment.remove(equipment.id);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () {
                  if (selectedEquipment.isNotEmpty) {
                    ref.read(shootingRequestProvider.notifier).assignEquipment(requestId, selectedEquipment);
                    Navigator.pop(context);
                    
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Equipment assigned successfully')),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please select at least one equipment')),
                    );
                  }
                },
                child: const Text('Assign'),
              ),
            ],
          );
        },
      ),
    );
  }
  
  void _showUpdateTripStatusDialog(BuildContext context, ShootingRequest request) {
    TripStatus selectedStatus = request.tripStatus ?? TripStatus.notStarted;
    
    // Determine available next statuses based on current status
    List<TripStatus> availableStatuses = [];
    switch (request.tripStatus) {
      case null:
      case TripStatus.notStarted:
        availableStatuses = [TripStatus.started];
        break;
      case TripStatus.started:
        availableStatuses = [TripStatus.arrived];
        break;
      case TripStatus.arrived:
        availableStatuses = [TripStatus.waiting, TripStatus.returningToOffice];
        break;
      case TripStatus.waiting:
        availableStatuses = [TripStatus.returningToOffice];
        break;
      case TripStatus.returningToOffice:
        availableStatuses = [TripStatus.returned];
        break;
      case TripStatus.returned:
        availableStatuses = []; // No further status changes
        break;
    }
    
    if (availableStatuses.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No further status updates available')),
      );
      return;
    }
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Update Trip Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Current Status:'),
            Text(
              _getTripStatusText(request.tripStatus ?? TripStatus.notStarted),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text('Update to:'),
            DropdownButtonFormField<TripStatus>(
              value: availableStatuses.first,
              items: availableStatuses.map((status) {
                return DropdownMenuItem<TripStatus>(
                  value: status,
                  child: Text(_getTripStatusText(status)),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  selectedStatus = value;
                }
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              ref.read(shootingRequestProvider.notifier).updateTripStatus(request.id, selectedStatus);
              Navigator.pop(context);
              
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Trip status updated to ${_getTripStatusText(selectedStatus)}')),
              );
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }
}