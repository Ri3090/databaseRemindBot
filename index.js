const {
    Client,
    Intents,
    MessageActionRow,
    MessageButton,
    Permissions,
    MessageEmbed,
} = require('discord.js');
const e = require('express');

const mysql = require('mysql');
const cron = require('node-cron');

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});
require('dotenv').config();

var dt = new Date();
let cronList = [];

//
var connection = mysql.createConnection({
    host: 'localhost', // ホスト名
    user: 'root', // ユーザー名
    root: '3306', // ポート番号
    password: 'riku130903', // パスワード
    database: 'sample' // データベース名
});

connection.connect();

const getChannelName = (guild, id) => {
    return guild.channels.cache.get(id).name;
};

const commands = {
    async ping(interaction) {
        const now = Date.now();
        const msg = ["pong!", "", `gateway: ${interaction.client.ws.ping}ms`];
        await interaction.reply({ content: msg.join("\n"), ephemeral: true });
        await interaction.editReply(
            [...msg, `往復: ${Date.now() - now}ms`].join("\n")
        );
        return;
    },

    hello(interaction) {
        const source = {
            en(name) {
                return `Hello, ${name}!`;
            },
            ja(name) {
                return `こんにちは、${name}さん`;
            },
        };
        const name =
            interaction.member?.displayName ?? interaction.user.username;
        const lang = interaction.options.get("language");
        return interaction.reply(source[lang.value](name));
    },

    async setting_reminder(interaction) {
        try {
            let userId = interaction.user.id;
            let userName = interaction.user.username

            //await Users.set(Number(0), { userId: userId, userName: userName, remindId: [] })//id,discord_id,name,remindId
            //await Reminders.set(Number(0), { title: 'noTitle', time: 'noTime', cronTime: 0 })//id,title,deadline,channel_id

            //database初期化
            connection.query(`
            drop table users`, (error, result) => {
                if (error) throw error;
                console.log('Users table deleted successfully.');
            });

            connection.query(`
            drop table reminders`, (error, result) => {
                if (error) throw error;
                console.log('Users table deleted successfully.');
            });

            connection.query(`
            CREATE TABLE Users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId VARCHAR(255) NOT NULL,
            userName VARCHAR(255) NOT NULL,
            remindId INT
            )`, (error, result) => {
                if (error) throw error;
                console.log('Users table created successfully.');
            });

            connection.query(`
            CREATE TABLE Reminders (
            remindId INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            time VARCHAR(255) NOT NULL,
            cronTime VARCHAR(255) NOT NULL
            )`, (error, result) => {
                if (error) throw error;
                console.log('Reminders table created successfully.');
            });

            //初期設定（コマンド実行者のユーザーIDとユーザー名を登録）
            //また、リマインダーレコードもテストで追加する。
            const registarUsers = `insert into Users (id, UserId, UserName, remindId) values (0, '${userId}', '${userName}', 1);`;
            const registarReminders = `insert into Reminders (remindId, title, time, cronTime) values (0, "テスト", "テスト", "0 0 0 * * *");`;

            connection.query(registarUsers, (err, result, fields) => {
                if (err) throw err;
                console.log(result)
            });

            connection.query(registarReminders, (err, result, fields) => {
                if (err) throw err;
                console.log(result)
            });

            await interaction.reply("リマインダーの初期設定が完了しました。")
        } catch (err) {
            console.error(err);
            await interaction.reply("リマインダーの初期設定に失敗しました。");
            return;
        }
    },

    async reminder(interaction) {
        try {
            let remindAll;
            function isRegistered(resolve) {
                const q = `select * from reminders;`;
                connection.query(q, (err, result, fields) => {
                    remindAll = result;
                    resolve(result);
                });
            }

            setTimeout(isRegistered, 500, (result) => {
                let msgB = "リマインド名|リマインド時間   \n";
                for(let i = 1; i < remindAll.length; i++){
                    msgB += `${remindAll[i].title}|${remindAll[i].time}\n`;
                }
                let msg = `現在登録されているリマインダーは以下の通りです\n ${msgB}`;
                interaction.reply(msg);
            });

            return;
        } catch (err) {
            console.error(err);
            await interaction.reply("現在登録されているリマインダーはありません");
            return;
        }
    },

    async create_reminder(interaction) {
        try {
            let name = interaction.options.get("name");
            let hour = interaction.options.get("hour");
            let time = hour.value.slice(0, 4);
            let value = hour.value.slice(5, hour.value.length);

            let user = interaction.user;
            let userId = user.id;
            let userName = user.username;

            let userCount;
            let remindCount;
            let userAll;
            let newRemindId;
            let userIdBuffer;
            let remindIdBuffer;

            //usersをカウント
            function isRegistered(resolve) {
                const q = `select count(*) from users;`;
                connection.query(q, (err, result, fields) => {
                    userCount = result[0]["count(*)"] + 1;
                    resolve(result);
                });
            }
            //remindersをカウント
            function isRegistered2(resolve) {
                const q = `select count(*) from reminders;`;
                connection.query(q, (err, result, fields) => {
                    remindCount = result[0]["count(*)"];
                    resolve(result);
                });
            }
            //userレコード全てを取得に
            function isRegistered3(resolve) {
                const q = `select * from users;`;
                connection.query(q, (err, result, fields) => {
                    userAll = result;
                    resolve(result);
                });
            }
            //指定したusersのレコードを取得
            function isRegistered4(resolve) {
                for (let i = 1; i < userCount; i++) {
                    if (userAll[i - 1].userId == userId) {
                        const q = `select * from users where UserId = ${userId};`;
                        connection.query(q, (err, result, fields) => {
                            userIdBuffer = result;
                            resolve(result);
                        });
                        break;
                    }
                }
            }
            //指定したremindersのレコードを取得
            function isRegistered5(resolve) {
                const q = `select * from reminders where remindId = ${remindCount};`;
                connection.query(q, (err, result, fields) => {
                    remindIdBuffer = result;
                    resolve(result);
                });
            }

            function isRegistered6(resolve) {
                newRemindId = userIdBuffer[0].remindId;
                newRemindId = 10 * newRemindId + remindCount + 1

                const q = `update users set remindId = ${newRemindId} where UserId = ${userId};`;
                connection.query(q, (err, result, fields) => {
                    remindIdBuffer = result;
                    resolve(result);
                });
            }

            function isRegistered7(resolve) {
                const q = `select count(*) from reminders;`;
                connection.query(q, (err, result, fields) => {
                    userCount = result[0]["count(*)"] + 1;
                    resolve(result);
                });
            }

            setTimeout(isRegistered, 800, (result) => {
            });

            setTimeout(isRegistered2, 900, (result) => {
            });

            setTimeout(isRegistered3, 1000, (result) => {
            });

            setTimeout(isRegistered4, 1100, (result) => {
            });

            setTimeout(isRegistered5, 1200, (result) => {
            });

            setTimeout(isRegistered6, 1300, (result) => {
                const registar = `insert into Reminders (remindId, title, time, cronTime) values (${remindCount + 1},"${name.value}", "${time}", "${value}")`;
                //新しいレコードを追加
                connection.query(registar, (err, result, fields) => {
                    if (err) throw err;
                    console.log(result)
                });

                const msg = `「${name.value}」を${time}に通知するリマインドを作成しました`;
                interaction.reply(msg);

                const cronMsg = '「' + name.value + '」は終わりましたか？';
                var dt = new Date();
                cronList.push([cron.schedule(value, () => {
                    user.send(`${dt.getMonth() + 1}月${dt.getDate()}日${dt.getHours()}時${dt.getMinutes()}分になりました。\n ${cronMsg}`);
                }), name.value]);
            });

            /*if (userSearch(userId, 0) == true) {//trueだったらuserを登録する。
                await Users.set(urCount(0), { userId: userId, userName: userName, reminderId: [] });//id,discord_id,name
                console.log("新規ユーザーを登録しました。")
            }*/

            return;
        } catch (err) {
            console.error(err);
            interaction.reply("エラーが発生しました");
            return;
        }
    },

    async delete_reminder(interaction) {
        try {
            let name = interaction.options.get("name");
            let remindName = name.value;
            let deleteRemindId;
            let remindbuffer;
            let user = interaction.user;
            let userId = user.id;
            let newRemindId;
            let newRemindId2;

            //消したいレコードのremindIdを取得
            function isRegistered(resolve) {
                const q = `select remindId from reminders where title = "${remindName}";`;
                connection.query(q, (err, result, fields) => {
                    deleteRemindId = result[0].remindId;
                    resolve(result);
                });
            }
            //消したいレコードを削除
            function isRegistered2(resolve) {
                const q = `delete from reminders where remindId = ${deleteRemindId};`;
                connection.query(q, (err, result, fields) => {
                    if (err) throw err;
                });
            }

            //指定したuserのremindIdを取得
            function isRegistered3(resolve) {
                const q = `select remindId from users where userId = ${userId};`;
                connection.query(q, (err, result, fields) => {
                    remindbuffer = result[0].remindId;
                    resolve(result);
                });
            }

            function isRegistered4(resolve) {
                newRemindId = remindbuffer.toString();
                let buffer = 0;
                console.log("aaa", deleteRemindId);
                console.log("111", newRemindId.length);
                console.log("uuu", newRemindId[0]);
                for (let i = 0; i < newRemindId.toString().length; i++) {
                    console.log(newRemindId[i]);
                    if (newRemindId[i] != deleteRemindId) {
                        if (i == 0) {
                            console.log("first");
                            buffer += Number(newRemindId[i]);
                        } else {
                            console.log("else")
                            buffer = buffer * 10 + newRemindId[i];
                        }
                    }
                }
                console.log("last", buffer);

                const q = `update users set remindId = ${buffer} where UserId = ${userId};`;
                connection.query(q, (err, result, fields) => {
                    remindbuffer = result;
                    resolve(result);
                });
            }

            setTimeout(isRegistered, 800, (result) => {
                for (let i = 0; i < cronList.length; i++) {
                    if (cronList[i][1] == remindName) {
                        cronList[i][0].stop();
                        delete cronList[i];
                        cronList = cronList.filter(Boolean); //ここで配列を詰めている
                    }
                }
            });
            setTimeout(isRegistered2, 900, (result) => {
            });
            setTimeout(isRegistered3, 1000, (result) => {
            });
            setTimeout(isRegistered4, 1100, (result) => {
            });


            const cronDeleteMsg = '「' + name.value + '」のリマインドを削除しました';
            await interaction.reply(`${cronDeleteMsg}`);
            return;
        } catch (err) {
            console.error(err);
            interaction.reply("エラーが発生しました");
            return;
        }
    },

    async test(interaction) {
        try {
            let user = interaction.user;
            let userId = user.id;
            let userCount;
            let remindCount;
            let userAll;
            let newRemindId;
            let userIdBuffer;
            let remindIdBuffer;
            //usersをカウント
            function isRegistered(resolve) {
                const q = `select count(*) from users;`;
                connection.query(q, (err, result, fields) => {
                    userCount = result[0]["count(*)"] + 1;
                    resolve(result);
                });
            }
            //remindersをカウント
            function isRegistered2(resolve) {
                const q = `select count(*) from reminders;`;
                connection.query(q, (err, result, fields) => {
                    remindCount = result[0]["count(*)"];
                    resolve(result);
                });
            }
            //userレコード全てを取得に
            function isRegistered3(resolve) {
                const q = `select * from users;`;
                connection.query(q, (err, result, fields) => {
                    userAll = result;
                    resolve(result);
                });
            }
            //指定したusersのレコードを取得
            function isRegistered4(resolve) {
                for (let i = 1; i < userCount; i++) {
                    if (userAll[i - 1].UserId == userId) {
                        const q = `select * from users where UserId = ${userId};`;
                        connection.query(q, (err, result, fields) => {
                            userIdBuffer = result;
                            resolve(result);
                        });
                        break;
                    }
                }
            }
            //指定したremindersのレコードを取得
            function isRegistered5(resolve) {
                console.log("---");
                console.log(remindCount);
                const q = `select * from reminders where remindId = ${remindCount};`;
                connection.query(q, (err, result, fields) => {
                    remindIdBuffer = result;
                    resolve(result);
                });
            }

            function isRegistered6(resolve) {
                newRemindId = userIdBuffer[0].remindId;
                newRemindId = 10 * newRemindId + remindCount + 1

                const q = `update users set remindId = ${newRemindId} where UserId = ${userId};`;
                connection.query(q, (err, result, fields) => {
                    remindIdBuffer = result;
                    resolve(result);
                });
            }

            setTimeout(isRegistered, 1200, (result) => {
            });

            setTimeout(isRegistered2, 1400, (result) => {
            });

            setTimeout(isRegistered3, 1600, (result) => {
                /*console.log(userAll);
                console.log(userAll[0].UserId);
                console.log(userAll[1-1]["UserId"]);*/
            });

            setTimeout(isRegistered4, 1800, (result) => {
            });

            setTimeout(isRegistered5, 2000, (result) => {
            });

            setTimeout(isRegistered6, 2100, (result) => {
            });

        } catch (err) {
            if (ReferenceError) {
                console.error(err);
                console.log("再設定が必要なリマインドはありません。")
            } else {
                console.error(err);
            }
            return;
        }
    },
};



async function onInteraction(interaction) {
    if (!interaction.isCommand()) {
        return;
    }
    return commands[interaction.commandName](interaction);
}

//button event
client.on("interactionCreate", async (interaction) => {
    try {
        if (interaction.isButton()) {
            const role = interaction.guild.roles.cache.find(role => role.name === interaction.customId);
            await interaction.member.roles.add(role);
            await interaction.reply({ content: `ロール「${role.name}」を付与しました`, ephemeral: true });
        }
    } catch (err) {
        console.error(err);
        await interaction.reply("エラーが発生しました");
    }
    return;
});

const settingRemind = async (client) => {
    try {
        let userAll;
        let remindAll;
        function isRegistered(resolve) {
            const q = `select * from users;`;
            connection.query(q, (err, result, fields) => {
                userAll = result;
                resolve(result);
            });
        }

        function isRegistered2(resolve) {
            const q = `select * from reminders;`;
            connection.query(q, (err, result, fields) => {
                remindAll = result;
                resolve(result);
            });
        }

        setTimeout(isRegistered, 500, (result) => {
        });

        setTimeout(isRegistered2, 800, (result) => {
            for (let i = 0; i < userAll.length; i++) {
                let user = userAll[i].userId;
                let remindBuffer = userAll[i].remindId.toString();
                for (let j = 0; j < userAll[i].remindId.toString().length; j++) {
                    for (let k = 0; k < remindAll.length; k++) {
                        console.log(user);
                        /*console.log(remindAll[k].cronTime);
                        console.log("remindAll" + remindAll);
                        console.log("remindBuffer[j]:" + remindBuffer[j]);
                        console.log("remindAll.length:" + remindAll.length);
                        console.log("remindAll[k].remindId:" + remindAll[k].remindId);*/
                        if (remindBuffer[j] == remindAll[k].remindId) {
                            let value = remindAll[k].cronTime;
                            console.log("aaaa" + value);
                            cronList.push([cron.schedule(value, () => {
                                user.send(`${dt.getMonth() + 1}月${dt.getDate()}日${dt.getHours()}時${dt.getMinutes()}分になりました。\n ${cronMsg}`);
                            }), remindAll[k].title]);
                            console.log(cronList);
                            break;
                        }
                    }
                }
            }
        });
    } catch (err) {
        if (ReferenceError) {
            console.error(err);
            console.log("再設定が必要なリマインドはありません。")
        } else {
            console.error(err);
        }
        return;
    }
}

client.on("interactionCreate", (interaction) =>
    onInteraction(interaction).catch((err) => console.error(err))
);
client.login(process.env.token).catch((err) => {
    console.error(err);
    process.exit(-1);
});
client.once('ready', () => {
    settingRemind(client);
    return;
});