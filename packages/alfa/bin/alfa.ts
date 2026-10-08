#!/usr/bin/env bun
import { createKernel, registerDefaultCommands } from "../src/console/index";

const kernel = registerDefaultCommands(createKernel());
process.exit(await kernel.run(process.argv.slice(2)));
