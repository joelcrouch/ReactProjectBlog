---
title: "Ok. I threw a bunch of stuff at the wall.  This is what is sticking."
date: "2025-11-18"
summary: "Lets just make sure terraform and ansible are working."
---

#  Getting the simple parts to work
Per the DDIA (classic book), if you can get a simple plan implemented, it is much more likely that the more complex plan will work. So I am applying this directly to my little distributed ML training, multi-cloud provider model.  The first thing we have to get working is terraform and ansible.  We need terraform to get all the isntances up and runnign on the various provdiers, and we use ansible to get the nitty-gritty details installed on each instance.  "Easy-sleazy, macaroni-cheesy".

Yeah. Super frigging easy.  

# Issues

So aws didn't like the arm instances I was attempting to set up.  It required them previously. I would rather have all the nodes have the same architecture, so this was a bonus.  Unasked for, and a PITA,but now all the architectures are the same. Coool.

#  What did i acutally have to fix?

BLEEP.BORG.BRRRG.BOOOP.  <robot noises>
```
Plan: 9 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + gcp_node_ips = [
      + (known after apply),
      + (known after apply),
      + (known after apply),
    ]
  + ssh_key_path = "./../.ssh/cluster_key.pem"
╷
│ Error: Your query returned no results. Please change your search criteria and try again.
│ 
│   with data.aws_ami.ubuntu,
│   on aws.tf line 72, in data "aws_ami" "ubuntu":
│   72: data "aws_ami" "ubuntu" {


```

The snippet above is a clip of an error that was propagated through the whole ding-dong module.  I changed the architecture in terraform/aws.tf but it also needed to be changed in variables.tf...blah, blah, blah.  Aftter running down and fixig all the errors, i reran it and `voila!  

Ahh, not quite. Raft is installing but aws is still not being nice to gcp.  What to do?

So now, aws instances get a lock and nothing else can be done til its done.  Great. I love concurrency and everything about debugging actions that happen synchonously/asynchronously/concurrent. Nothing like running down non-reproducible errors. 

This is not one of those. Lets do 1)add some sleep() into the setup_Nodes.yml or something similar, maybe some type of more robust re-trying logic and try that.

Wait one.  That is working?  I'll be damned. 

Well. Not quite. Now there is one rando gcp instance just frogging around:

```
PLAY RECAP *****************************************************************************************************************************************************************************
3.235.253.211              : ok=18   changed=9    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
3.237.31.248               : ok=18   changed=9    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
34.133.190.160             : ok=17   changed=9    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
34.46.2.52                 : ok=1    changed=0    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0   
35.222.28.44               : ok=18   changed=9    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
44.197.230.115             : ok=18   changed=9    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   



```


Hmmmm. That is not showing the error. It should be showing a failure on '34.46.2.52'...oh wait one.  There it is.  Ok.  What to do?  Since the instances are up and working/running, jsut cd into ansible and run " ansible-playbook setup_nodes.yml".  This will skip all the parts that dont need to be rerun. Idempotency-i love you ansible.  


Anyways. Kablammo.

```
PLAY RECAP ******************************************************************************************************************
3.235.253.211              : ok=15   changed=0    unreachable=0    failed=0    skipped=2    rescued=0    ignored=0   
3.237.31.248               : ok=15   changed=0    unreachable=0    failed=0    skipped=2    rescued=0    ignored=0   
34.133.190.160             : ok=15   changed=0    unreachable=0    failed=0    skipped=2    rescued=0    ignored=0   
34.46.2.52                 : ok=17   changed=9    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
35.222.28.44               : ok=15   changed=0    unreachable=0    failed=0    skipped=2    rescued=0    ignored=0   
44.197.230.115             : ok=15   changed=0    unreachable=0    failed=0    skipped=2    rescued=0    ignored=0   



```


So getting just the bare-bones nodes up and chatting with each other with the correct raft/python worker is done. Not super easy. Not terrbile. Once you do this 3-100 times, it should be second nature.  

Anyways, run terraform destroy. Dont push any secrets to github.  I will return tomorrow, and make the code acutally do stuff. 


Man.  I really wish the first iteration worked. I would be so much further along.  Furter along with a pile of garbage.