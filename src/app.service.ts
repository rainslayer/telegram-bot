import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf, Markup, Context } from 'telegraf';

enum BotCommands {
  GO_DEEPER = 'Go Deeper',
  GO_TO_LEVEL_1 = 'Go to level 1',
  RETURN_1_LEVEL_UP = 'Return 1 level up',
}

@Injectable()
export class AppService implements OnModuleInit {
  private readonly bot = new Telegraf(process.env.BOT_TOKEN);
  private readonly userDepthStorage: Record<string, number> = {};

  private readonly menuOptions = {
    1: [BotCommands.GO_DEEPER],
    2: [
      BotCommands.GO_DEEPER,
      BotCommands.GO_TO_LEVEL_1,
      BotCommands.RETURN_1_LEVEL_UP,
    ],
    3: [
      BotCommands.GO_DEEPER,
      BotCommands.GO_TO_LEVEL_1,
      BotCommands.RETURN_1_LEVEL_UP,
    ],
    4: [BotCommands.GO_TO_LEVEL_1, BotCommands.RETURN_1_LEVEL_UP],
  };

  constructor() {
    this.bot.start(this.handleStart.bind(this));
    this.bot.hears(
      BotCommands.GO_DEEPER,
      this.handleGoDeeperMessage.bind(this),
    );
    this.bot.hears(
      BotCommands.GO_TO_LEVEL_1,
      this.handleGoToLevel1Message.bind(this),
    );
    this.bot.hears(
      BotCommands.RETURN_1_LEVEL_UP,
      this.handleGo1LevelUpMessage.bind(this),
    );
  }

  async onModuleInit() {
    await this.bot.launch();
  }

  private async handleStart(ctx: Context) {
    const { id } = ctx.from;
    this.userDepthStorage[id] = 1;

    return await this.replyWithMenu(ctx, 'Please select an option from menu');
  }

  private async handleGoDeeperMessage(ctx: Context) {
    const { id } = ctx.from;
    const currentLevel = this.userDepthStorage[id];

    if (currentLevel + 1 > Object.keys(this.menuOptions).length) {
      return await this.replyWithMenu(ctx, 'Already on last level');
    }

    this.userDepthStorage[id] += 1;
    return await this.replyWithMenu(
      ctx,
      `At level ${this.userDepthStorage[id]} now`,
    );
  }

  private async handleGoToLevel1Message(ctx: Context) {
    const { id } = ctx.from;
    const currentLevel = this.userDepthStorage[id];
    if (currentLevel === 1) {
      return await this.replyWithMenu(ctx, 'Already on 1st level');
    }

    this.userDepthStorage[id] = 1;
    return await this.replyWithMenu(ctx, 'Returned to level 1');
  }

  private async handleGo1LevelUpMessage(ctx: Context) {
    const { id } = ctx.from;
    const currentLevel = this.userDepthStorage[id];

    if (currentLevel === 1) {
      return await this.replyWithMenu(ctx, 'Already at upmost level');
    }

    this.userDepthStorage[id] -= 1;
    return await this.replyWithMenu(
      ctx,
      `At level ${this.userDepthStorage[id]} now`,
    );
  }

  private async replyWithMenu(ctx: Context, message: string) {
    return ctx.reply(message, this.generateMenu(ctx.from.id));
  }

  private generateMenu(userId: number) {
    const menu = this.menuOptions[this.userDepthStorage[userId]].map(
      (option: string) => Markup.button.callback(option, option),
    );
    return Markup.keyboard(menu, { columns: 3 }).resize();
  }
}
