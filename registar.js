const {Client, ClientApplication} = require("discord.js");

async function register(client, commands, guildID) {
    if (guildID == null) {
        return client.application.commands.set(commands);
    }
    return client.application.commands.set(commands, guildID);
}

const ping = {
    name: "ping",
    description: "pong!",
};

const hello = {
    name: "hello",
    description: "botがあなたに挨拶します",
    options: [
        {
            type: "STRING",
            name: "language",
            description: "どの言語で挨拶するか指定します",
            required: true,
            choices: [
                {
                    name: "English",
                    value: "en",
                },
                {
                    name: "Japanese",
                    value: "ja",
                },
            ],
        },
    ],
};

const reminder = {
    name: "reminder",
    description: "現在登録中のリマインダーを確認します",
};

const create_reminder = {
    name: "create_reminder",
    description: "リマインドを設定します",
    options: [
        {
            type: "STRING",
            name: "name",
            description: "再通知名を指定します",
            required: true,
        },
        {
            type: "STRING",
            name: "hour",
            description: "時間を指定します",
            required: true,
            choices: [
                {
                    name: "5秒毎",
                    value: "5秒ごと */5 * * * * *", //valueは先頭5文字までをnameとして使い、それ以降はスライスしてcronに使う
                },
                {
                    name: "毎日0時",
                    value: "毎日0時 0 0 0 * * *",
                },
                {
                    name: "毎日6時",
                    value: "毎日6時 0 0 6 * * *",
                },
                {
                    name: "毎日12時",
                    value: "毎日12時0 0 12 * * *",
                },
                {
                    name: "毎日18時",
                    value: "毎日18時0 0 18 * * *",
                },
            ],
        },
    ],
};

const delete_reminder = {
    name: "delete_reminder",
    description: "リマインドを削除します",
    options: [
        {
            type: "STRING",
            name: "name",
            description: "削除したいリマインド名を指定します",
            required: true,
        },
    ],
};

const setting_reminder = {
    name: "setting_reminder",
    description: "リマインド初期設定を行います",
};

const test = {
    name: "test",
    description: "test",
};

const commands = [ping, 
                hello, 
                reminder, 
                create_reminder, 
                delete_reminder, 
                setting_reminder,
                test,
                ];
const client = new Client({
    intents: 0,
});
require("dotenv").config();

client.token = process.env.token;

async function main() {
    client.application = new ClientApplication(client, {});
    await client.application.fetch();
    await register(client, commands, process.argv[2]);
    console.log("registration succeed!");
}

main().catch((err) => console.error(err));
