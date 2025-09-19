CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,
    user_id INT,
    content TEXT NOT NULL,
    is_fake BOOLEAN,
    hate_speech_score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);