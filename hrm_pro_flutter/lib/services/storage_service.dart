import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hrm_pro_flutter/models/user.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  final SharedPreferences _prefs;
  final FlutterSecureStorage _secureStorage;

  StorageService(this._prefs, this._secureStorage);

  // Theme
  Future<void> saveThemeMode(ThemeMode themeMode) async {
    await _prefs.setString('themeMode', themeMode.toString());
  }

  Future<ThemeMode?> getThemeMode() async {
    final themeModeString = _prefs.getString('themeMode');
    if (themeModeString == null) return null;
    
    switch (themeModeString) {
      case 'ThemeMode.light':
        return ThemeMode.light;
      case 'ThemeMode.dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  // Auth
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: 'auth_token');
  }

  Future<void> clearToken() async {
    await _secureStorage.delete(key: 'auth_token');
  }

  Future<void> saveUser(User user) async {
    await _prefs.setString('user', jsonEncode(user.toJson()));
  }

  Future<User?> getUser() async {
    final userJson = _prefs.getString('user');
    if (userJson == null) return null;
    
    return User.fromJson(jsonDecode(userJson));
  }

  Future<void> clearUser() async {
    await _prefs.remove('user');
  }

  // General preferences
  Future<void> saveString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  String? getString(String key) {
    return _prefs.getString(key);
  }

  Future<void> saveBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }

  bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  Future<void> saveInt(String key, int value) async {
    await _prefs.setInt(key, value);
  }

  int? getInt(String key) {
    return _prefs.getInt(key);
  }

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }

  Future<void> clear() async {
    await _prefs.clear();
    await _secureStorage.deleteAll();
  }
}

final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError('Initialize in main.dart with actual instances');
});

// Provider initialization function to be called in main.dart
Future<StorageService> initializeStorageService() async {
  final prefs = await SharedPreferences.getInstance();
  const secureStorage = FlutterSecureStorage();
  return StorageService(prefs, secureStorage);
}