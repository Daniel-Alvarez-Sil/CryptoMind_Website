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
### Create environment variables to connect to AWS Database (mySQL). 
```bash
sudo nano ~/.bashrc
```
Add the following lines at the end of the open file. 
```bash
export MYSQL_HOST="some_host"
export MYSQL_USER="admin"
export MYSQL_PASSWORD="some_password"
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

