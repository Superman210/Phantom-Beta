```
yum install -y vim
mkdir /home/mongodb && mkdir -p /home/phserver/phantom
chmod -R 777 /home/phserver/
chmod -R 777 /home/mongodb/
```

MongoDB


```
vim /etc/yum.repos.d/mongodb-org-3.4.repo
```

```
[mongodb-org-3.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc
```

```
yum install -y mongodb-org
```

Config
```
storage:
  dbPath: /home/mongodb

security:
  authorization: enabled
```

Create user
```
use admin
db.createUser(
    {
      user: "theghost",
      pwd: "BXVQH8E0foyW6PrK",
      roles: [ "root" ]
    }
)
```

Install redis
```
yum install -y epel-release && yum update && yum install -y redis
service redis start
```
on Mac OS X
$redis-server

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
nvm install v8.6
npm install -g forever
```