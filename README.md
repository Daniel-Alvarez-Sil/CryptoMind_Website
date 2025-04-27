# CryptoMind Website
Website for the CryptoMind Project. 

This project consists of the admin page to visualize metrics from the videogame, CryptoMind. CryptoMind is a videogame that implements lessons about BlockChain and AI.

## Instructions to Run Project.
Clone Repository.
```bash
git clone https://github.com/Daniel-Alvarez-Sil/CryptoMind_Website.git
cd CryptoMind_Website
cd CryptoMind
```

### Prerequisites.
> Note:
> This documentation assumes an Ubuntu OS.

Install Node.js:
```bash
# Download and install fnm:
winget install Schniz.fnm
# Download and install Node.js:
fnm install 23
# Verify the Node.js version:
node -v # Should print "v23.11.0".
# Verify npm version:
npm -v # Should print "10.9.2".
```

Install nodemon:
```bash
npm install -g nodemon
```

### Create environment variables to connect to AWS Database (mySQL). 
```bash
sudo nano ~/.bashrc
```
Add the following lines at the end of the open file. 
```bash
export MYSQL_HOST="db-cryptomind.cmkp6fsa6pac.us-east-1.rds.amazonaws.com"
export MYSQL_USER="admin"
export MYSQL_PASSWORD="P0K3M0NJ4P4N26_m"
```
---
Install dependencies. 
```bash
npm install
```
Run project.
```bash
..CryptoMind_Website/CryptoMind $ nodemon app.mjs
```

## Running the Website. 
When running the website on your machine, the login will prompt you to insert some credentials. When this happens, use the following credentials: 
- Username: das@gmail.com
- Password: prueba123
![Imagen de WhatsApp 2025-04-12 a las 20 23 46_19c98ece](https://github.com/user-attachments/assets/80bacaee-ba45-4947-9927-a9aa00bce9fc)

Great! You are now inside the Official CryptoMind Website for Admins. There are three main modules of the website:
- Dashboard: contains important metrics to measure the engagement and impact of the game.
- Users: displays important information about users, as well as an analysis of the demographics of all users (gender, country, etc...).
  - Individual User: displays important information about an individual user, specially concerning its engagement with the courses and quizzes within the game.
- Courses: allows the visualization of the impact a course, and its corresponding levels, has had on the players that consume the game. Ex., how many users are "enrolled" on a certain course, how many users have played (or are playing) a certain level of a course. 

__The ultimate purpose of this web project is to allow for a better understanding of the performance of the game. So as to make the necessary changes to increase its public reach.__
