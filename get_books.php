<?php

include "db.php";

$sql = "SELECT * FROM books";
$result = $conn->query($sql);

$books = [];

while ($row = $result->fetch_assoc()) {
    $books[] = $row;
}

header("Content-Type: application/json");

echo json_encode($books);

$conn->close();

?>