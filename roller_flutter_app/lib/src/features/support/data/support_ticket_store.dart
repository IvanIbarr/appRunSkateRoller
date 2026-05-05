import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../auth/data/auth_repository.dart';

class SupportTicket {
  SupportTicket({
    required this.id,
    required this.createdAtIso,
    required this.area,
    required this.title,
    required this.description,
    required this.status,
    this.fromEmail,
    this.fromUserId,
  });

  final String id;
  final String createdAtIso;
  final String area;
  final String title;
  final String description;
  final String status; // nuevo | visto | resuelto
  final String? fromEmail;
  final String? fromUserId;

  Map<String, dynamic> toJson() => {
        'id': id,
        'createdAtIso': createdAtIso,
        'area': area,
        'title': title,
        'description': description,
        'status': status,
        'fromEmail': fromEmail,
        'fromUserId': fromUserId,
      };

  static SupportTicket fromJson(Map<String, dynamic> j) => SupportTicket(
        id: (j['id'] ?? '').toString(),
        createdAtIso: (j['createdAtIso'] ?? '').toString(),
        area: (j['area'] ?? '').toString(),
        title: (j['title'] ?? '').toString(),
        description: (j['description'] ?? '').toString(),
        status: (j['status'] ?? 'nuevo').toString(),
        fromEmail: j['fromEmail']?.toString(),
        fromUserId: j['fromUserId']?.toString(),
      );
}

class SupportTicketStore {
  SupportTicketStore(this._storage);
  final FlutterSecureStorage _storage;

  static const _key = 'support_tickets_v1';

  Future<List<SupportTicket>> list() async {
    final raw = await _storage.read(key: _key);
    if (raw == null || raw.trim().isEmpty) return [];
    final decoded = jsonDecode(raw);
    if (decoded is! List) return [];
    final tickets = decoded.whereType<Map>().map((e) => SupportTicket.fromJson(Map<String, dynamic>.from(e))).toList();
    tickets.sort((a, b) => b.createdAtIso.compareTo(a.createdAtIso));
    return tickets;
  }

  Future<void> _write(List<SupportTicket> items) async {
    final list = items.map((t) => t.toJson()).toList();
    await _storage.write(key: _key, value: jsonEncode(list));
  }

  Future<SupportTicket> add({
    required String area,
    required String title,
    required String description,
    String? fromEmail,
    String? fromUserId,
  }) async {
    final items = await list();
    final now = DateTime.now();
    final id = '${now.millisecondsSinceEpoch}-${items.length + 1}';
    final tk = SupportTicket(
      id: id,
      createdAtIso: now.toIso8601String(),
      area: area,
      title: title,
      description: description,
      status: 'nuevo',
      fromEmail: fromEmail,
      fromUserId: fromUserId,
    );
    await _write([tk, ...items]);
    return tk;
  }

  Future<void> updateStatus(String id, String status) async {
    final items = await list();
    final next = items
        .map((t) => t.id == id
            ? SupportTicket(
                id: t.id,
                createdAtIso: t.createdAtIso,
                area: t.area,
                title: t.title,
                description: t.description,
                status: status,
                fromEmail: t.fromEmail,
                fromUserId: t.fromUserId,
              )
            : t)
        .toList();
    await _write(next);
  }

  Future<void> delete(String id) async {
    final items = await list();
    await _write(items.where((t) => t.id != id).toList());
  }

  Future<void> clearAll() async {
    await _storage.delete(key: _key);
  }
}

final supportTicketStoreProvider = Provider<SupportTicketStore>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return SupportTicketStore(storage);
});

