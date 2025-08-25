// client.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

// Global variable to store the last fetched expenses for deletion/reference
List<dynamic> lastExpenses = [];

Future<void> main() async {
  print("===== Login =====");
  stdout.write("Username: ");
  String? username = stdin.readLineSync()?.trim();
  stdout.write("Password: ");
  String? password = stdin.readLineSync()?.trim();

  if (username == null || password == null || username.isEmpty || password.isEmpty) {
    print("Incomplete input");
    return;
  }

  // login
  final loginUrl = Uri.parse('http://localhost:3000/login');
  final response = await http.post(loginUrl, body: {
    "username": username,
    "password": password
  });

  if (response.statusCode != 200) {
    print("Login failed: ${response.body}");
    return;
  }

  final loginData = jsonDecode(response.body);
  int userId = loginData["userId"];

  // menu loop
  while (true) {
    print("\n========= Expense Tracking App =========");
    print("Welcome $username");
    print("1. All expenses");
    print("2. Today's expense");
    print("3. Search expense");
    print("4. Add new expense");
    print("5. Delete an expense");
    print("6. Exit");
    stdout.write("Choose... ");
    String? choice = stdin.readLineSync();

    if (choice == "1") {
      await fetchExpenses(userId, all: true);
    } else if (choice == "2") {
      await fetchExpenses(userId, all: false);
    } else if (choice == "3") {
      stdout.write("Item to search: ");
      String? keyword = stdin.readLineSync()?.trim();
      if (keyword != null && keyword.isNotEmpty) {
        await searchExpense(userId, keyword);
      }
    } else if (choice == "4") {
      print("===== Add new item =====");
      stdout.write("Item: ");
      String? item = stdin.readLineSync()?.trim();
      stdout.write("Paid: ");
      String? paidStr = stdin.readLineSync()?.trim();
      int? paid = int.tryParse(paidStr ?? "");
      if (item != null && item.isNotEmpty && paid != null) {
        await addExpense(userId, item, paid);
      }
    } else if (choice == "5") {
      print("===== Delete an item =====");
      stdout.write("Item id: ");
      String? idStr = stdin.readLineSync()?.trim();
      int? expenseId = int.tryParse(idStr ?? "");
      if (expenseId != null) {
        await deleteExpenseById(userId, expenseId);
      }
    } else if (choice == "6") {
      print("----- Bye --------");
      break;
    } else {
      print("Invalid choice, try again.");
    }
  }
}

Future<void> fetchExpenses(int userId, {required bool all}) async {
  final url = all
      ? Uri.parse("http://localhost:3000/expenses/all/$userId")
      : Uri.parse("http://localhost:3000/expenses/today/$userId");

  final response = await http.get(url);
  if (response.statusCode != 200) {
    print("Error fetching expenses: ${response.body}");
    return;
  }

  final List<dynamic> expenses = jsonDecode(response.body);
  lastExpenses = expenses; // Store for potential reference
  
  if (expenses.isEmpty) {
    print("No expenses found.");
    return;
  }

  int total = 0;
  print(all ? "------------ All expenses -----------" : "------------ Today's expenses -----------");
  for (var e in expenses) {
    total += e["paid"] as int;
    print("${e["id"]}. ${e["item"]} : ${e["paid"]}฿ : ${e["date"]}");
  }
  print("Total expenses = $total฿");
}

Future<void> searchExpense(int userId, String keyword) async {
  final url = Uri.parse("http://localhost:3000/expenses/search/$userId/$keyword");
  final response = await http.get(url);
  if (response.statusCode != 200) {
    print("Error searching expenses: ${response.body}");
    return;
  }
  final List<dynamic> results = jsonDecode(response.body);
  if (results.isEmpty) {
    print("No item: $keyword");
    return;
  }
  for (var e in results) {
    print("${e["id"]}. ${e["item"]} : ${e["paid"]}฿ : ${e["date"]}");
  }
}

Future<void> addExpense(int userId, String item, int paid) async {
  final url = Uri.parse("http://localhost:3000/expenses/add");
  final response = await http.post(url, body: {
    "userId": userId.toString(),
    "item": item,
    "paid": paid.toString(),
  });
  if (response.statusCode != 200) {
    print("Error adding expense: ${response.body}");
    return;
  }
  print("Inserted!");
}

Future<void> deleteExpenseById(int userId, int expenseId) async {
  final url = Uri.parse("http://localhost:3000/expenses/delete/$expenseId/$userId");
  final response = await http.delete(url);
  if (response.statusCode != 200) {
    print("Error deleting expense: ${response.body}");
    return;
  }
  print("Deleted!");
}
